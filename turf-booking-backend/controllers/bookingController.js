const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Slot    = require("../models/Slot");
const Turf    = require("../models/Turf");
const User    = require("../models/User");

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

    // Convert string IDs to ObjectIds
    // Convert string IDs to ObjectIds
    const objectIds = slot_ids.map(id => new mongoose.Types.ObjectId(id));

    // Fetch requested slots
    const slots = await Slot.find({
      _id:     { $in: objectIds },
      turf_id: turf_id,
    });

    // Check all slot_ids were found
    if (slots.length !== slot_ids.length) {
      return res.status(400).json({
        message: "One or more slots not found for this turf",
      });
    }

    // Check all slots are available
    const unavailableSlots = slots.filter((s) => s.status !== "available");
    if (unavailableSlots.length > 0) {
      return res.status(400).json({
        message: "One or more slots are not available",
        unavailable: unavailableSlots.map((s) => ({
          slot_id:    s._id,
          start_time: s.start_time,
          end_time:   s.end_time,
          status:     s.status,
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
    const end_time   = sortedSlots[sortedSlots.length - 1].end_time;

    // Hold all slots for 10 minutes
    const held_until = new Date(Date.now() + HOLD_MINUTES * 60 * 1000);

    await Slot.updateMany(
      { _id: { $in: objectIds } },
      {
        $set: {
          status:    "on_hold",
          booked_by: user_id,
          held_until,
        },
      }
    );

    // Create booking with pending status
    const booking = await Booking.create({
      user_id,
      turf_id,
      slot_ids,
      date:        new Date(date),
      start_time,
      end_time,
      total_amount,

      turf_name_snapshot:      turf.name,
      turf_address_snapshot:   turf.location?.address || "",
      price_per_slot_snapshot: slots[0].price,

      payment: {
        status:  "pending",
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
      booking_id:   booking._id,
      total_amount,
      start_time,
      end_time,
      held_until,
      slots_held:   slot_ids.length,
    });
  } catch (error) {
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
      count:   bookings.length,
      bookings,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── Get Single Booking ───────────────────────────────────────────────────────
const getBookingById = async (req, res) => {
  try {
    const user_id    = req.user._id;
    const booking_id = req.params.id;

    const booking = await Booking.findOne({ _id: booking_id, user_id })
      .populate("turf_id",  "name location.address location.city images rating")
      .populate("slot_ids", "start_time end_time price status date");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.status(200).json({
      message: "Booking fetched successfully",
      booking,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── Cancel Booking ───────────────────────────────────────────────────────────
const cancelBooking = async (req, res) => {
  try {
    const user_id    = req.user._id;
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
          status:     "available",
          booked_by:  null,
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
    booking.booking_status        = "cancelled";
    booking.cancellation = {
      cancelled_at:  new Date(),
      reason:        reason || "Other",
      cancelled_by:  "user",
      refund_amount,
      refund_status,
    };
    await booking.save();

    res.status(200).json({
      message:        "Booking cancelled successfully",
      booking_id:     booking._id,
      refund_amount,
      refund_status,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── Confirm Booking Directly (No Payment) ───────────────────────────────────
const confirmBookingDirect = async (req, res) => {
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

    // Convert string IDs to ObjectIds
    // Convert string IDs to ObjectIds
    const objectIds = slot_ids.map(id => new mongoose.Types.ObjectId(id));

    // Fetch requested slots
    const slots = await Slot.find({
      _id:     { $in: objectIds },
      turf_id: turf_id,
    });

    // Check all slot_ids were found
    if (slots.length !== slot_ids.length) {
      return res.status(400).json({
        message: "One or more slots not found for this turf",
      });
    }

    // Check all slots are available
    const unavailableSlots = slots.filter((s) => s.status !== "available");
    if (unavailableSlots.length > 0) {
      return res.status(400).json({
        message: "One or more slots are no longer available",
        unavailable: unavailableSlots.map((s) => ({
          slot_id:    s._id,
          start_time: s.start_time,
          end_time:   s.end_time,
          status:     s.status,
        })),
      });
    }

    // Calculate total amount
    const total_amount = slots.reduce((sum, s) => sum + s.price, 0);

    // Get start and end time from sorted slots
    const sortedSlots = [...slots].sort((a, b) =>
      a.start_time.localeCompare(b.start_time)
    );
    const start_time = sortedSlots[0].start_time;
    const end_time   = sortedSlots[sortedSlots.length - 1].end_time;

    // Mark slots as booked immediately (with status, booked_by, and held_until)
    const updateResult = await Slot.updateMany(
      { _id: { $in: objectIds } },
      {
        $set: {
          status:     "booked",
          booked_by:  user_id,
          held_until: null,
        },
      }
    );

    console.log(`Updated ${updateResult.modifiedCount} slots to 'booked' status`);

    // Create booking with confirmed status (skip payment)
    const booking = await Booking.create({
      user_id,
      turf_id,
      slot_ids,
      date:        new Date(date),
      start_time,
      end_time,
      total_amount,

      turf_name_snapshot:      turf.name,
      turf_address_snapshot:   turf.location?.address || "",
      price_per_slot_snapshot: slots[0].price,

      payment: {
        status:  "pending",   // will be updated when Razorpay is integrated
        gateway: "razorpay",
      },
      booking_status: "confirmed",
    });

    // Link booking_id back onto the slots
    const finalUpdate = await Slot.updateMany(
      { _id: { $in: objectIds } },
      { $set: { booking_id: booking._id } }
    );

    console.log(`Linked booking ID to ${finalUpdate.modifiedCount} slots`);

    // Add booking id to user's booking_ids
    await User.findByIdAndUpdate(user_id, {
      $push: { booking_ids: booking._id },
    });

    res.status(201).json({
      message:      "Booking confirmed successfully!",
      booking_id:   booking._id,
      total_amount,
      start_time,
      end_time,
      booking_status: "confirmed",
      turf_name:    turf.name,
      slots_booked: slot_ids.length,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createBooking,
  confirmBookingDirect,
  getUserBookings,
  getBookingById,
  cancelBooking,
};