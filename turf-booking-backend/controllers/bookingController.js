const mongoose = require("mongoose");
const razorpay = require("../config/razorpay");
const Booking = require("../models/Booking");
const Slot = require("../models/Slot");
const Turf = require("../models/Turf");
const User = require("../models/User");
const { sendCancellationEmail } = require("../utils/sendEmail");
const generateInvoice = require("../utils/generateInvoice");

const HOLD_MINUTES = 10; // slots held for 10 mins during payment

// ─── Create Booking (Hold Slots) ──────────────────────────────────────────────
const createBooking = async (req, res) => {
  try {
    const { turf_id, date, slot_ids } = req.body;
    const user_id = req.user._id;

    // Validate required fields
    if (!turf_id || !date || !slot_ids || slot_ids.length === 0) {
      return res.status(400).json({
        message: "turf_id, date and slot_ids are required",
      });
    }

    // Check turf exists
    const turf = await Turf.findById(turf_id);
    if (!turf) {
      return res.status(404).json({ message: "Turf not found" });
    }

    // Auto-expire any stale on_hold slots first
    await Slot.updateMany(
      { status: "on_hold", held_until: { $lt: new Date() } },
      { $set: { status: "available", held_until: null, booked_by: null } }
    );

    // ── Handle "temp-" slots (Virtual slots not yet in DB) ───────────────────
    const finalSlotIds = [];
    const duration = turf.slot_duration_minutes;

    // Helper to format minutes to HH:MM
    const formatTime = (mins) => {
      const normalized = mins % (24 * 60);
      const h = Math.floor(normalized / 60);
      const m = normalized % 60;
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    };

    for (let sid of slot_ids) {
      if (typeof sid === "string" && sid.startsWith("temp-")) {
        const startTimeStr = sid.replace("temp-", "");
        const [h, m] = startTimeStr.split(":").map(Number);
        const startMin = h * 60 + m;
        const endTimeStr = formatTime(startMin + duration);

        // Determine price for this specific slot (replica of controller logic)
        let price = turf.price_per_hour;
        const [y, mm, d_num] = date.split("-").map(Number);
        const dayDate = new Date(Date.UTC(y, mm - 1, d_num));
        const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        const dayName = days[dayDate.getUTCDay()];
        
        const overrides = turf.pricing_overrides || {};
        const isWeekend = dayName === "saturday" || dayName === "sunday";
        if (isWeekend && overrides.weekend_price) price = overrides.weekend_price;
        
        const peakHours = overrides.peak_hours || {};
        if (peakHours.start && peakHours.end && overrides.peak_hour_price) {
          const [sH, sM] = peakHours.start.split(":").map(Number);
          const [eH, eM] = peakHours.end.split(":").map(Number);
          const psM = sH * 60 + sM; let peM = eH * 60 + eM;
          if (peM <= psM) peM += 1440;
          const norm = startMin % 1440;
          const isPeak = peM > 1440 ? (norm >= psM || norm < (peM - 1440)) : (norm >= psM && norm < peM);
          if (isPeak) price = overrides.peak_hour_price;
        }

        // Check if a real slot was created meanwhile
        let realSlot = await Slot.findOne({
          turf_id,
          date: dayDate,
          start_time: startTimeStr,
        });

        if (!realSlot) {
          realSlot = await Slot.create({
            turf_id,
            date: dayDate,
            start_time: startTimeStr,
            end_time: endTimeStr,
            price,
            status: "available",
          });
        }
        finalSlotIds.push(realSlot._id.toString());
      } else {
        finalSlotIds.push(sid);
      }
    }

    // Now validate finalSlotIds
    for (const sid of finalSlotIds) {
      if (!mongoose.isValidObjectId(sid)) {
        return res.status(400).json({ message: `Invalid slot id after resolution: ${sid}` });
      }
    }

    // Convert string IDs to ObjectIds
    const objectIds = finalSlotIds.map((id) => new mongoose.Types.ObjectId(id));

    // Fetch requested slots using objectIds
    const slots = await Slot.find({
      _id: { $in: objectIds },
      turf_id: turf_id,
    });

    // Check all slot_ids were found
    if (slots.length !== finalSlotIds.length) {
      return res.status(400).json({
        message: "One or more slots not found for this turf",
      });
    }

    // Check all slots are available or held by the current user
    const unavailableSlots = slots.filter(
      (s) => s.status !== "available" && !(s.status === "on_hold" && s.booked_by?.toString() === user_id.toString())
    );
    if (unavailableSlots.length > 0) {
      return res.status(400).json({
        message: "One or more slots are not available",
        unavailable: unavailableSlots.map((s) => ({
          slot_id: s._id,
          start_time: s.start_time,
          end_time: s.end_time,
          status: s.status,
        })),
      });
    }

    // Calculate total amount
    const total_amount = slots.reduce((sum, s) => sum + s.price, 0);

    // Get start and end time from slots
    const sortedSlots = slots.sort((a, b) =>
      a.start_time.localeCompare(b.start_time)
    );
    const start_time = sortedSlots[0].start_time;
    const end_time = sortedSlots[sortedSlots.length - 1].end_time;

    // Hold all slots for 10 minutes
    const held_until = new Date(Date.now() + HOLD_MINUTES * 60 * 1000);

    await Slot.updateMany(
      { _id: { $in: objectIds } },
      {
        $set: {
          status: "on_hold",
          booked_by: user_id,
          held_until,
        },
      }
    );

    // Create booking with pending status
    const booking = await Booking.create({
      user_id,
      turf_id,
      slot_ids: finalSlotIds,
      date: new Date(date),
      start_time,
      end_time,
      total_amount,

      turf_name_snapshot: turf.name,
      turf_address_snapshot: turf.location?.address || "",
      price_per_slot_snapshot: slots[0].price,

      payment: {
        status: "pending",
        gateway: "razorpay",
      },
      booking_status: "pending",
    });

    // Add booking id to user's booking_ids
    await User.findByIdAndUpdate(user_id, {
      $push: { booking_ids: booking._id },
    });

    res.status(201).json({
      message: "Booking created and slots held for 10 minutes. Complete payment to confirm.",
      booking_id: booking._id,
      total_amount,
      start_time,
      end_time,
      held_until,
      slots_held: finalSlotIds.length,
    });
  } catch (error) {
    // Log full error for debugging (stack trace) before responding
    console.error("createBooking error:", error && error.stack ? error.stack : error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── Get User Bookings ────────────────────────────────────────────────────────
const getUserBookings = async (req, res) => {
  try {
    const user_id = req.user._id;

    const bookings = await Booking.find({ user_id })
      .sort({ created_at: -1 })
      .populate("turf_id", "name location.address location.city images")
      .populate("slot_ids", "start_time end_time price status date");

    res.status(200).json({
      message: "Bookings fetched successfully",
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    // Log full error for debugging (stack trace) before responding
    console.error("getBookingById error:", error && error.stack ? error.stack : error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── Get Single Booking ───────────────────────────────────────────────────────
const getBookingById = async (req, res) => {
  try {
    const user_id = req.user._id;
    const booking_id = req.params.id;

    const booking = await Booking.findOne({ _id: booking_id, user_id })
      .populate("turf_id", "name location.address location.city images rating")
      .populate("slot_ids", "start_time end_time price status date");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // ── FALLBACK: Create missing payment link for confirmed bookings ───────────
    if (booking.payment.status === "advance_paid" && !booking.payment.balance_link_url) {
      console.log(`[DEBUG] Attempting JIT link creation for booking: ${booking._id}`);
      try {
        const user = await User.findById(user_id);
        const advanceAmount = booking.payment.advance_amount || 200;
        const balanceDue = booking.total_amount - advanceAmount;
        
        console.log(`[DEBUG] Total: ${booking.total_amount}, Advance: ${advanceAmount}, Balance: ${balanceDue}`);

        if (balanceDue > 0) {
          const paymentLinkOptions = {
            amount:      balanceDue * 100,
            currency:    "INR",
            accept_partial: false,
            description: `Remaining balance for booking #${booking._id.toString().slice(-8).toUpperCase()} at ${booking.turf_name_snapshot || 'Vega Sports'}`,
            customer: {
              name:  user?.name  || "Customer",
              email: user?.email || "",
              contact: user?.phone || "",
            },
            notify: { sms: false, email: false },
            reminder_enable: false,
            notes: {
              booking_id: booking._id.toString(),
              type: "balance",
            },
            callback_url: `${process.env.BASE_URL}/api/payment/balance-webhook`,
            callback_method: "get",
          };

          const link = await razorpay.paymentLink.create(paymentLinkOptions);
          booking.payment.balance_link_id  = link.id;
          booking.payment.balance_link_url = link.short_url;
          await booking.save();
          console.log("[DEBUG] Success! JIT Link created:", link.short_url);
        } else {
          console.log("[DEBUG] Skipping: Balance is 0 or negative.");
        }
      } catch (linkErr) {
        console.error("[DEBUG] Failed to create JIT link:", linkErr.description || linkErr.message);
      }
    } else {
      if (booking.payment.status === "advance_paid") {
        console.log("[DEBUG] Skipping: Link already exists.");
      } else {
        console.log(`[DEBUG] Skipping: Payment status is ${booking.payment.status}`);
      }
    }

    res.status(200).json({
      message: "Booking fetched successfully",
      booking,
    });
  } catch (error) {
    console.error("getBookingById error:", error && error.stack ? error.stack : error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── Cancel Booking ───────────────────────────────────────────────────────────
const cancelBooking = async (req, res) => {
  try {
    const user_id = req.user._id;
    const booking_id = req.params.id;
    const { reason } = req.body;

    const booking = await Booking.findOne({ _id: booking_id, user_id });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Only pending or confirmed bookings can be cancelled
    if (!["pending", "confirmed"].includes(booking.booking_status)) {
      return res.status(400).json({
        message: `Cannot cancel a booking with status: ${booking.booking_status}`,
      });
    }

    // Free up the slots
    await Slot.updateMany(
      { _id: { $in: booking.slot_ids } },
      {
        $set: {
          status: "available",
          booked_by: null,
          held_until: null,
          booking_id: null,
        },
      }
    );

    // Calculate refund
    // Full refund if payment was made, otherwise no refund
    const refund_amount = booking.payment.status === "paid"
      ? booking.total_amount
      : 0;

    const refund_status = booking.payment.status === "paid"
      ? "pending"
      : "na";

    // Update booking
    booking.booking_status = "cancelled";
    booking.cancellation = {
      cancelled_at: new Date(),
      reason: reason || "Other",
      cancelled_by: "user",
      refund_amount,
      refund_status,
    };
    await booking.save();

    try {
      const user = await User.findById(user_id);
      if (user && user.email) {
        await sendCancellationEmail({
          to: user.email,
          name: user.name,
          booking: booking,
        });
      }
    } catch (emailErr) {
      console.error("Cancellation email failed:", emailErr.message);
    }

    res.status(200).json({
      message: "Booking cancelled successfully",
      booking_id: booking._id,
      refund_amount,
      refund_status,
    });
  } catch (error) {
    console.error("cancelBooking error:", error && error.stack ? error.stack : error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
// ─── Get Upcoming Bookings ────────────────────────────────────────────────────
const getUpcomingBookings = async (req, res) => {
  try {
    const user_id = req.user._id;
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const bookings = await Booking.find({
      user_id,
      date: { $gte: today },
      booking_status: { $in: ["pending", "confirmed"] },
    })
      .sort({ date: 1, start_time: 1 })
      .populate("turf_id", "name location.address location.city images")
      .populate("slot_ids", "start_time end_time price status");

    res.status(200).json({
      message: "Upcoming bookings fetched successfully",
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("getUpcomingBookings error:", error && error.stack ? error.stack : error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── Get Booking History ──────────────────────────────────────────────────────
const getBookingHistory = async (req, res) => {
  try {
    const user_id = req.user._id;
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const bookings = await Booking.find({
      user_id,
      $or: [
        { booking_status: { $in: ["completed", "cancelled", "failed"] } },
        { date: { $lt: today } },
      ],
    })
      .sort({ created_at: -1 })
      .populate("turf_id", "name location.address location.city images")
      .populate("slot_ids", "start_time end_time price status");

    res.status(200).json({
      message: "Booking history fetched successfully",
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("getBookingHistory error:", error && error.stack ? error.stack : error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
// ─── Download Invoice ─────────────────────────────────────────────────────────
const downloadInvoice = async (req, res) => {
  try {
    const user_id = req.user._id;
    const booking_id = req.params.id;

    const booking = await Booking.findOne({ _id: booking_id, user_id })
      .populate("slot_ids", "start_time end_time price");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Only allow invoice for confirmed or completed bookings
    if (!["confirmed", "completed"].includes(booking.booking_status)) {
      return res.status(400).json({
        message: "Invoice only available for confirmed or completed bookings",
      });
    }

    const user = await User.findById(user_id).select("name email phone");

    // Generate PDF buffer
    const pdfBuffer = await generateInvoice(booking, user);

    // Set response headers for file download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice_${booking._id}.pdf`
    );

    res.send(pdfBuffer);
  } catch (error) {
    console.error("downloadInvoice error:", error && error.stack ? error.stack : error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
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