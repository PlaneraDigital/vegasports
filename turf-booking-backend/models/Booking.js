const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    turf_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Turf",
      required: true,
    },
    slot_ids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Slot",
      },
    ],

    date: { type: Date, required: true },
    start_time: { type: String, required: true },
    end_time:   { type: String, required: true },

    total_amount: { type: Number, required: true },

    // Snapshots — store at time of booking so history is preserved
    turf_name_snapshot:      { type: String },
    turf_address_snapshot:   { type: String },
    price_per_slot_snapshot: { type: Number },

    payment: {
      status: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending",
      },
      transaction_id: { type: String, default: null },
      gateway: {
        type: String,
        enum: ["razorpay", "stripe", "paytm", "cashfree"],
        default: "razorpay",
      },
      paid_at: { type: Date, default: null },

      // Razorpay specific fields
      razorpay_order_id:   { type: String, default: null },
      razorpay_payment_id: { type: String, default: null },
      razorpay_signature:  { type: String, default: null },
    },

    booking_status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled", "failed"],
      default: "pending",
    },

    cancellation: {
      cancelled_at: { type: Date,   default: null },
      reason: {
        type: String,
        enum: ["Changed plans", "Emergency", "Weather", "Other", null],
        default: null,
      },
      cancelled_by: {
        type: String,
        enum: ["user", "owner", "admin", null],
        default: null,
      },
      refund_amount: { type: Number, default: 0 },
      refund_status: {
        type: String,
        enum: ["pending", "processed", "na"],
        default: "na",
      },
    },
  },
  { timestamps: { createdAt: "created_at" } }
);

module.exports = mongoose.model("Booking", bookingSchema, "bookings");