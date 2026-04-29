const mongoose = require("mongoose");
const razorpay = require("../config/razorpay");
const Booking = require("../models/Booking");
const Slot = require("../models/Slot");
const Turf = require("../models/Turf");
const User = require("../models/User");
const { sendCancellationEmail } = require("../utils/sendEmail");
const generateInvoice = require("../utils/generateInvoice");

const HOLD_MINUTES = 10; 

// ─── Helper: Overlap Check ──────────────────────────────────────────────────
const isOverlapping = (s1, e1, s2, e2) => {
  const toMins = (t) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  let start1 = toMins(s1);
  let end1   = toMins(e1);
  let start2 = toMins(s2);
  let end2   = toMins(e2);
  if (end1 <= start1) end1 += 1440;
  if (end2 <= start2) end2 += 1440;
  return start1 < end2 && start2 < end1;
};

// ─── Create Booking (Hold Slots) ──────────────────────────────────────────────
const createBooking = async (req, res) => {
  try {
    const { turf_id, date, slot_ids } = req.body;
    const user_id = req.user._id;

    if (!turf_id || !date || !slot_ids || slot_ids.length === 0) {
      return res.status(400).json({ message: "turf_id, date and slot_ids are required" });
    }

    const turf = await Turf.findById(turf_id);
    if (!turf) return res.status(404).json({ message: "Turf not found" });

    const [y, m, d] = date.split("-").map(Number);
    const startOfDay = new Date(Date.UTC(y, m - 1, d));
    const endOfDay   = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));

    const existingBooked = await Slot.find({
      turf_id,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ["booked", "on_hold", "blocked"] }
    });

    const MORNING_START = 7 * 60;
    const MORNING_END   = 19 * 60;
    const getPrice = (tStr) => {
      const [h, mm] = tStr.split(":").map(Number);
      const m = h * 60 + mm;
      if (m >= MORNING_START && m < MORNING_END) return turf.pricing?.morning?.price ?? turf.price_per_hour;
      return turf.pricing?.evening?.price ?? turf.price_per_hour;
    };

    let finalSlotIds = [];
    let finalSlotsData = [];

    for (const sid of slot_ids) {
      let slot;
      if (typeof sid === "string" && sid.startsWith("temp-")) {
        const parts = sid.replace("temp-", "").split("|");
        const startTime = parts.length > 1 ? parts[1] : parts[0];
        const [h, mm] = startTime.split(":").map(Number);
        const startMins = h * 60 + mm;
        const duration = turf.slot_duration_minutes || 60;
        const endMins = (startMins + duration) % 1440;
        const endTime = `${String(Math.floor(endMins/60)).padStart(2,'0')}:${String(endMins%60).padStart(2,'0')}`;
        
        const clash = existingBooked.find(b => isOverlapping(startTime, endTime, b.start_time, b.end_time));
        if (clash) return res.status(400).json({ message: `Slot ${startTime} is no longer available.` });

        slot = await Slot.create({
          turf_id, date: startOfDay, start_time: startTime, end_time: endTime,
          price: getPrice(startTime), status: "on_hold", booked_by: user_id,
          held_until: new Date(Date.now() + HOLD_MINUTES * 60 * 1000)
        });
      } else {
        slot = await Slot.findById(sid);
        if (!slot) return res.status(404).json({ message: `Slot ${sid} not found` });
        if (slot.status !== "available" && !(slot.status === "on_hold" && slot.booked_by?.toString() === user_id.toString())) {
          return res.status(400).json({ message: `Slot ${slot.start_time} is already booked.` });
        }
        slot.status = "on_hold"; slot.booked_by = user_id;
        slot.held_until = new Date(Date.now() + HOLD_MINUTES * 60 * 1000);
        await slot.save();
      }
      finalSlotIds.push(slot._id);
      finalSlotsData.push(slot);
    }

    const total_amount = finalSlotsData.reduce((sum, s) => sum + s.price, 0);
    const sorted = finalSlotsData.sort((a,b) => a.start_time.localeCompare(b.start_time));
    const start_time = sorted[0].start_time;
    const end_time = sorted[sorted.length - 1].end_time;

    const booking = await Booking.create({
      user_id, turf_id, slot_ids: finalSlotIds, date: startOfDay,
      start_time, end_time, total_amount,
      turf_name_snapshot: turf.name,
      turf_address_snapshot: turf.location?.address || "",
      price_per_slot_snapshot: finalSlotsData[0].price,
      payment: { status: "pending", gateway: "razorpay" },
      booking_status: "pending",
    });

    await User.findByIdAndUpdate(user_id, { $push: { booking_ids: booking._id } });

    res.status(201).json({
      message: "Booking initiated.",
      booking_id: booking._id,
      total_amount,
      start_time,
      end_time,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getUserBookings = async (req, res) => {
  try {
    const user_id = req.user._id;
    const bookings = await Booking.find({ user_id }).sort({ created_at: -1 })
      .populate("turf_id", "name location.address location.city images")
      .populate("slot_ids", "start_time end_time price status date");
    res.status(200).json({ message: "Bookings fetched successfully", count: bookings.length, bookings });
  } catch (error) { res.status(500).json({ message: "Server error", error: error.message }); }
};

const getBookingById = async (req, res) => {
  try {
    const user_id = req.user._id;
    const booking = await Booking.findOne({ _id: req.params.id, user_id })
      .populate("turf_id", "name location.address location.city images rating")
      .populate("slot_ids", "start_time end_time price status date");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // ── FALLBACK: Create missing payment link for confirmed bookings (Partial Payment feature) ──
    if (booking.payment.status === "advance_paid" && !booking.payment.balance_link_url) {
      try {
        const user = await User.findById(user_id);
        const advanceAmount = booking.payment.advance_amount || 200;
        const balanceDue = booking.total_amount - advanceAmount;
        if (balanceDue > 0) {
          const backendBase = process.env.BACKEND_URL || `http://localhost:5001`;
          const amountPaise = Math.round(balanceDue * 100);
          const link = await razorpay.paymentLink.create({
            amount: amountPaise, currency: "INR", accept_partial: false,
            description: `Balance for ${booking.turf_name_snapshot}`,
            customer: { name: user?.name || "Customer", email: user?.email || "", contact: user?.phone || "" },
            callback_url: `${backendBase}/api/payment/balance-webhook`,
            callback_method: "get",
          });
          booking.payment.balance_link_id = link.id;
          booking.payment.balance_link_url = link.short_url;
          await booking.save();
        }
      } catch (err) { console.error("JIT Link creation failed", err); }
    }
    res.status(200).json({ message: "Booking fetched successfully", booking });
  } catch (error) { res.status(500).json({ message: "Server error", error: error.message }); }
};

const cancelBooking = async (req, res) => {
  try {
    const user_id = req.user._id;
    const booking = await Booking.findOne({ _id: req.params.id, user_id });
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (!["pending", "confirmed"].includes(booking.booking_status)) return res.status(400).json({ message: "Cannot cancel" });
    await Slot.updateMany({ _id: { $in: booking.slot_ids } }, { $set: { status: "available", booked_by: null } });
    booking.booking_status = "cancelled";
    await booking.save();
    res.status(200).json({ message: "Booking cancelled" });
  } catch (error) { res.status(500).json({ message: "Server error", error: error.message }); }
};

const getUpcomingBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user_id: req.user._id, date: { $gte: new Date().setUTCHours(0,0,0,0) }, booking_status: { $in: ["pending", "confirmed"] } })
      .sort({ date: 1 }).populate("turf_id", "name location.address").populate("slot_ids", "start_time end_time price");
    res.status(200).json({ bookings });
  } catch (error) { res.status(500).json({ message: "Server error" }); }
};

const getBookingHistory = async (req, res) => {
  try {
    const bookings = await Booking.find({ user_id: req.user._id, booking_status: { $in: ["completed", "cancelled", "failed"] } })
      .sort({ created_at: -1 }).populate("turf_id", "name location.address").populate("slot_ids", "start_time end_time");
    res.status(200).json({ bookings });
  } catch (error) { res.status(500).json({ message: "Server error" }); }
};

const downloadInvoice = async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, user_id: req.user._id }).populate("slot_ids");
    const user = await User.findById(req.user._id);
    const pdfBuffer = await generateInvoice(booking, user);
    res.setHeader("Content-Type", "application/pdf");
    res.send(pdfBuffer);
  } catch (error) { res.status(500).json({ message: "Server error" }); }
};

module.exports = { createBooking, getUserBookings, getBookingById, cancelBooking, getUpcomingBookings, getBookingHistory, downloadInvoice };