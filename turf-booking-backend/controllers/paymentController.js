const crypto   = require("crypto");
const Booking  = require("../models/Booking");
const Slot     = require("../models/Slot");
const razorpay = require("../config/razorpay");

// ─── Create Razorpay Order ────────────────────────────────────────────────────
const createOrder = async (req, res) => {
  try {
    const { booking_id } = req.body;
    const user_id = req.user._id;

    if (!booking_id) {
      return res.status(400).json({ message: "booking_id is required" });
    }

    // Find booking and make sure it belongs to this user
    const booking = await Booking.findOne({ _id: booking_id, user_id });
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Only allow order creation for pending bookings
    if (booking.booking_status !== "pending") {
      return res.status(400).json({
        message: `Cannot create order for booking with status: ${booking.booking_status}`,
      });
    }

    // Check if payment already done
    if (booking.payment.status === "paid") {
      return res.status(400).json({ message: "Booking is already paid" });
    }

    // Create Razorpay order
    // Amount must be in paise (1 INR = 100 paise)
    const options = {
      amount:   booking.total_amount * 100,
      currency: "INR",
      receipt:  `receipt_${booking._id}`,
      notes: {
        booking_id: booking._id.toString(),
        user_id:    user_id.toString(),
      },
    };

    const order = await razorpay.orders.create(options);

    // Save razorpay_order_id to booking
    booking.payment.razorpay_order_id = order.id;
    await booking.save();

    res.status(200).json({
      message:          "Razorpay order created successfully",
      order_id:         order.id,
      amount:           order.amount,
      currency:         order.currency,
      booking_id:       booking._id,
      total_amount:     booking.total_amount,
      razorpay_key_id:  process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── Verify Razorpay Payment ──────────────────────────────────────────────────
const verifyPayment = async (req, res) => {
  try {
    const {
      booking_id,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const user_id = req.user._id;

    // Validate all fields
    if (!booking_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        message: "booking_id, razorpay_order_id, razorpay_payment_id and razorpay_signature are required",
      });
    }

    // Find booking
    const booking = await Booking.findOne({ _id: booking_id, user_id });
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check order_id matches
    if (booking.payment.razorpay_order_id !== razorpay_order_id) {
      return res.status(400).json({ message: "Order ID mismatch" });
    }

    // ── Signature Verification (most important step) ──────────────────────────
    // Razorpay signs the payment using:
    // HMAC SHA256(razorpay_order_id + "|" + razorpay_payment_id, key_secret)
    const body      = razorpay_order_id + "|" + razorpay_payment_id;
    const expected  = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    const isValid = expected === razorpay_signature;

    if (!isValid) {
      // Payment is invalid — mark booking as failed
      booking.booking_status        = "failed";
      booking.payment.status        = "failed";
      await booking.save();

      return res.status(400).json({ message: "Payment verification failed. Invalid signature." });
    }

    // ── Payment is valid — update everything ──────────────────────────────────

    // 1. Update booking to confirmed
    booking.booking_status              = "confirmed";
    booking.payment.status              = "paid";
    booking.payment.razorpay_order_id   = razorpay_order_id;
    booking.payment.razorpay_payment_id = razorpay_payment_id;
    booking.payment.razorpay_signature  = razorpay_signature;
    booking.payment.transaction_id      = razorpay_payment_id;
    booking.payment.paid_at             = new Date();
    await booking.save();

    // 2. Update all slots to booked
    await Slot.updateMany(
      { _id: { $in: booking.slot_ids } },
      {
        $set: {
          status:     "booked",
          booking_id: booking._id,
          held_until: null,
        },
      }
    );

    res.status(200).json({
      message:        "Payment verified successfully. Booking confirmed!",
      booking_id:     booking._id,
      booking_status: booking.booking_status,
      payment_status: booking.payment.status,
      paid_at:        booking.payment.paid_at,
      total_amount:   booking.total_amount,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { createOrder, verifyPayment };