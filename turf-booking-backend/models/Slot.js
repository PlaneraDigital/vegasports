const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema(
  {
    turf_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Turf",
      required: true,
    },
    booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },

    date: {
      type: Date,
      required: true,
    },
    start_time: {
      type: String,
      required: true,
    },
    end_time: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["available", "on_hold", "booked", "blocked", "expired"],
      default: "available",
    },

    booked_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    held_until: {
      type: Date,
      default: null,
    },
    blocked_reason: {
      type: String,
      enum: ["Maintenance", "Holiday", "Private Event", "Booked", null],
      default: null,
    },
  },
  { timestamps: { createdAt: "created_at" } }
);

// Unique constraint as per schema design
slotSchema.index(
  { turf_id: 1, date: 1, start_time: 1, end_time: 1 },
  { unique: true }
);

module.exports = mongoose.model("Slot", slotSchema, "slots");