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
        enum: ["pending", "advance_paid", "paid", "failed", "refunded"],
        default: "pending",
      },
      payment_type: {
        type: String,
        enum: ["full", "advance"],
        default: "full",
      },
      transaction_id: { type: String, default: null },
      gateway: {
        type: String,
        enum: ["razorpay", "stripe", "paytm", "cashfree", "cash"],
        default: "razorpay",
      },
      paid_at:  { type: Date, default: null },

      // Advance payment fields
      advance_amount:     { type: Number, default: 0 },
      advance_paid_at:    { type: Date, default: null },

      // Balance payment link (Razorpay Payment Link)
      balance_link_id:    { type: String, default: null },
      balance_link_url:   { type: String, default: null },
      balance_paid_at:    { type: Date, default: null },

      // Razorpay specific fields (advance order)
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
        enum: ["Changed plans", "Emergency", "Weather", "Other"],
        default: null,
        required: false,
      },
      cancelled_by: {
        type: String,
        enum: ["user", "owner", "admin", null],
        default: null,
      },
      refund_amount: { type: Number, default: 0 },
      refund_status: {
        type: String,
        enum: ["pending", "processed", "failed", "na"],
        default: "na",
      },
      refund_ids: [{ type: String }],
    },
  },
  { timestamps: { createdAt: "created_at" } }
);

module.exports = mongoose.model("Booking", bookingSchema, "bookings");