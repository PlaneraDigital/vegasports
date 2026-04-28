const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Slot = require("../models/Slot");
const Turf = require("../models/Turf");
const User = require("../models/User");
const { sendCancellationEmail } = require("../utils/sendEmail");
const generateInvoice = require("../utils/generateInvoice");

const HOLD_MINUTES = 10; // slots held for 10 mins during payment

// ─── Helper: Overlap Check ──────────────────────────────────────────────────
const isOverlapping = (s1, e1, s2, e2) => {
  const toMins = (t) => {
    const [h, m] = t.split(":").map(Number);
    let tot = h * 60 + m;
    return tot;
  };
  let start1 = toMins(s1);
  let end1   = toMins(e1);
  let start2 = toMins(s2);
  let end2   = toMins(e2);
  if (end1 === 0 && start1 > 1200) end1 = 1440;
  if (end2 === 0 && start2 > 1200) end2 = 1440;
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

    // ── Day range for fetching bookings ──────────────────────────────────────
    const [y, m, d] = date.split("-").map(Number);
    const startOfDay = new Date(Date.UTC(y, m - 1, d));
    const endOfDay   = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));

    // ── Fetch all currently booked/held slots for this day ───────────────────
    const existingBooked = await Slot.find({
      turf_id,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ["booked", "on_hold", "blocked"] }
    });

    // ── Morning/Evening price helper ──────────────────────────────────────────
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

    // ── Process each slot_id (can be real ObjectId or temp-HH:MM) ──────────────
    for (const sid of slot_ids) {
      let slot;
      if (sid.startsWith("temp-")) {
        // It's a virtual slot. We need to create it in the DB if it doesn't overlap.
        const startTime = sid.replace("temp-", "");
        const [h, mm] = startTime.split(":").map(Number);
        const startMins = h * 60 + mm;
        const duration = turf.slot_duration_minutes || 60;
        
        // Format end_time (handles 24:00 wrapping as 00:00)
        const endMins = (startMins + duration) % 1440;
        const endTime = `${String(Math.floor(endMins/60)).padStart(2,'0')}:${String(endMins%60).padStart(2,'0')}`;
        
        // Final Overlap Check before creating
        const clash = existingBooked.find(b => isOverlapping(startTime, endTime, b.start_time, b.end_time));
        if (clash) {
          return res.status(400).json({ message: `Slot ${startTime} is no longer available due to overlap.` });
        }

        // Create the slot record
        slot = await Slot.create({
          turf_id,
          date: startOfDay,
          start_time: startTime,
          end_time: endTime,
          price: getPrice(startTime),
          status: "on_hold",
          booked_by: user_id,
          held_until: new Date(Date.now() + HOLD_MINUTES * 60 * 1000)
        });
      } else {
        // It's an existing slot in the DB
        slot = await Slot.findById(sid);
        if (!slot) return res.status(404).json({ message: `Slot ${sid} not found` });
        
        // Check if already taken
        if (slot.status !== "available" && !(slot.status === "on_hold" && slot.booked_by?.toString() === user_id.toString())) {
          return res.status(400).json({ message: `Slot starting ${slot.start_time} is already booked.` });
        }

        // Update to on_hold
        slot.status = "on_hold";
        slot.booked_by = user_id;
        slot.held_until = new Date(Date.now() + HOLD_MINUTES * 60 * 1000);
        await slot.save();
      }
      
      finalSlotIds.push(slot._id);
      finalSlotsData.push(slot);
    }

    // ── Calculate Summary ─────────────────────────────────────────────────────
    const total_amount = finalSlotsData.reduce((sum, s) => sum + s.price, 0);
    const sorted = finalSlotsData.sort((a,b) => a.start_time.localeCompare(b.start_time));
    const start_time = sorted[0].start_time;
    const end_time = sorted[sorted.length - 1].end_time;

    // Create Booking
    const booking = await Booking.create({
      user_id,
      turf_id,
      slot_ids: finalSlotIds,
      date: startOfDay,
      start_time,
      end_time,
      total_amount,
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

// ... (rest of the file remains same, but I'll provide the full exports below)
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
    res.status(200).json({ message: "Booking fetched successfully", booking });
  } catch (error) { res.status(500).json({ message: "Server error", error: error.message }); }
};

const cancelBooking = async (req, res) => {
  try {
    const user_id = req.user._id;
    const booking = await Booking.findOne({ _id: req.params.id, user_id });
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (!["pending", "confirmed"].includes(booking.booking_status)) {
      return res.status(400).json({ message: `Cannot cancel a booking with status: ${booking.booking_status}` });
    }
    await Slot.updateMany({ _id: { $in: booking.slot_ids } }, { $set: { status: "available", booked_by: null, held_until: null, booking_id: null } });
    const refund_amount = booking.payment.status === "paid" ? booking.total_amount : 0;
    const refund_status = booking.payment.status === "paid" ? "pending" : "na";
    booking.booking_status = "cancelled";
    booking.cancellation = { cancelled_at: new Date(), reason: req.body.reason || "Other", cancelled_by: "user", refund_amount, refund_status };
    await booking.save();
    try {
      const user = await User.findById(user_id);
      if (user && user.email) await sendCancellationEmail({ to: user.email, name: user.name, booking: booking });
    } catch (emailErr) { console.error("Cancellation email failed:", emailErr.message); }
    res.status(200).json({ message: "Booking cancelled successfully", booking_id: booking._id, refund_amount, refund_status });
  } catch (error) { res.status(500).json({ message: "Server error", error: error.message }); }
};

const getUpcomingBookings = async (req, res) => {
  try {
    const user_id = req.user._id;
    const today = new Date(); today.setUTCHours(0, 0, 0, 0);
    const bookings = await Booking.find({ user_id, date: { $gte: today }, booking_status: { $in: ["pending", "confirmed"] } })
      .sort({ date: 1, start_time: 1 }).populate("turf_id", "name location.address location.city images")
      .populate("slot_ids", "start_time end_time price status");
    res.status(200).json({ message: "Upcoming bookings fetched successfully", count: bookings.length, bookings });
  } catch (error) { res.status(500).json({ message: "Server error", error: error.message }); }
};

const getBookingHistory = async (req, res) => {
  try {
    const user_id = req.user._id;
    const today = new Date(); today.setUTCHours(0, 0, 0, 0);
    const bookings = await Booking.find({ user_id, $or: [ { booking_status: { $in: ["completed", "cancelled", "failed"] } }, { date: { $lt: today } } ] })
      .sort({ created_at: -1 }).populate("turf_id", "name location.address location.city images")
      .populate("slot_ids", "start_time end_time price status");
    res.status(200).json({ message: "Booking history fetched successfully", count: bookings.length, bookings });
  } catch (error) { res.status(500).json({ message: "Server error", error: error.message }); }
};

const downloadInvoice = async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, user_id: req.user._id }).populate("slot_ids", "start_time end_time price");
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (!["confirmed", "completed"].includes(booking.booking_status)) {
      return res.status(400).json({ message: "Invoice only available for confirmed or completed bookings" });
    }
    const user = await User.findById(req.user._id).select("name email phone");
    const pdfBuffer = await generateInvoice(booking, user);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=invoice_${booking._id}.pdf`);
    res.send(pdfBuffer);
  } catch (error) { res.status(500).json({ message: "Server error", error: error.message }); }
};

module.exports = {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking,
  getUpcomingBookings,
  getBookingHistory,
  downloadInvoice,
};