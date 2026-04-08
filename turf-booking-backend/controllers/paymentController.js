const { sendBookingConfirmationEmail } = require("../utils/sendEmail");
const User     = require("../models/User");
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

const verifyPayment = async (req, res) => {
  try {
    const {
      booking_id,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const user_id = req.user._id;

    if (!booking_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        message: "booking_id, razorpay_order_id, razorpay_payment_id and razorpay_signature are required",
      });
    }

    const booking = await Booking.findOne({ _id: booking_id, user_id });
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.payment.razorpay_order_id !== razorpay_order_id) {
      return res.status(400).json({ message: "Order ID mismatch" });
    }

    // Verify signature
    const body     = razorpay_order_id + "|" + razorpay_payment_id;
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    const isValid = expected === razorpay_signature;

    if (!isValid) {
      booking.booking_status = "failed";
      booking.payment.status = "failed";
      await booking.save();
      return res.status(400).json({ message: "Payment verification failed. Invalid signature." });
    }

    // Update booking
    booking.booking_status              = "confirmed";
    booking.payment.status              = "paid";
    booking.payment.razorpay_order_id   = razorpay_order_id;
    booking.payment.razorpay_payment_id = razorpay_payment_id;
    booking.payment.razorpay_signature  = razorpay_signature;
    booking.payment.transaction_id      = razorpay_payment_id;
    booking.payment.paid_at             = new Date();
    await booking.save();

    // Update slots to booked
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

    // Send confirmation email
    try {
      const user = await User.findById(booking.user_id);
      if (user && user.email) {
        await sendBookingConfirmationEmail({
          to:      user.email,
          name:    user.name,
          booking: booking,
        });
      }
    } catch (emailErr) {
      console.error("Email sending failed:", emailErr.message);
    }

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