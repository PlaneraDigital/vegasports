const { sendRedCardEmail, sendBlueCardEmail } = require("../utils/sendEmail");
const User     = require("../models/User");
const crypto   = require("crypto");
const Booking  = require("../models/Booking");
const Slot     = require("../models/Slot");
const razorpay = require("../config/razorpay");
const { releaseExpiredHolds } = require("../utils/holdManager");

const ADVANCE_AMOUNT = 200; // ₹200 fixed advance

// ─── Refund Logic (Internal Helper) ────────────────────────────────────────────
const processRefund = async (booking) => {
  try {
    const paymentIds = new Set();
    if (booking.payment.razorpay_payment_id) paymentIds.add(booking.payment.razorpay_payment_id);
    if (booking.payment.transaction_id) paymentIds.add(booking.payment.transaction_id);

    if (paymentIds.size === 0) return { status: "na", message: "No payments to refund" };

    const refundResults = [];
    for (const pid of paymentIds) {
      try {
        const refund = await razorpay.payments.refund(pid, {
          notes: { 
            booking_id: booking._id.toString(), 
            reason: booking.cancellation?.reason || "Booking Cancelled" 
          }
        });
        refundResults.push(refund.id);
      } catch (err) {
        console.error(`Refund failed for payment ${pid}:`, err.message);
      }
    }

    if (refundResults.length > 0) {
      booking.cancellation.refund_status = "processed";
      booking.cancellation.refund_ids = (booking.cancellation.refund_ids || []).concat(refundResults);
      await booking.save();
      return { status: "processed", refund_ids: refundResults };
    }

    booking.cancellation.refund_status = "failed";
    await booking.save();
    return { status: "failed", message: "Refund initiation failed for all payments" };
  } catch (error) {
    console.error("processRefund error:", error.message);
    return { status: "failed", error: error.message };
  }
};

// ─── Create Full Payment Razorpay Order ──────────────────────────────────────
const createOrder = async (req, res) => {
  try {
    const { booking_id } = req.body;
    const user_id = req.user._id;

    // Release expired holds first
    await releaseExpiredHolds();

    if (!booking_id) return res.status(400).json({ message: "booking_id is required" });

    const booking = await Booking.findOne({ _id: booking_id, user_id });
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Check if hold has expired (booking auto-failed by holdManager or manually)
    if (booking.booking_status === "failed") {
      return res.status(410).json({
        message: "Your hold on the slot has expired (10-minute limit). Please start a new booking.",
        expired: true
      });
    }

    if (booking.booking_status !== "pending")
      return res.status(400).json({ message: `Cannot create order for booking with status: ${booking.booking_status}` });

    if (booking.payment.status === "paid")
      return res.status(400).json({ message: "Booking is already paid" });

    const options = {
      amount:  booking.total_amount * 100,
      currency: "INR",
      receipt:  `receipt_${booking._id}`,
      notes: { booking_id: booking._id.toString(), user_id: user_id.toString() },
    };

    const order = await razorpay.orders.create(options);
    booking.payment.razorpay_order_id = order.id;
    booking.payment.payment_type = "full";
    await booking.save();

    res.status(200).json({
      message:         "Razorpay order created successfully",
      order_id:        order.id,
      amount:          order.amount,
      currency:        order.currency,
      booking_id:      booking._id,
      total_amount:    booking.total_amount,
      razorpay_key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("createOrder error:", error && error.stack ? error.stack : error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── Verify Full Payment ──────────────────────────────────────────────────────
const verifyPayment = async (req, res) => {
  try {
    const { booking_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const user_id = req.user._id;

    if (!booking_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature)
      return res.status(400).json({ message: "All payment fields are required" });

    const booking = await Booking.findOne({ _id: booking_id, user_id });
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.payment.razorpay_order_id !== razorpay_order_id)
      return res.status(400).json({ message: "Order ID mismatch" });

    // ── Signature verification (always do this first to validate the payment is genuine) ──
    const body     = razorpay_order_id + "|" + razorpay_payment_id;
    const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(body).digest("hex");

    if (expected !== razorpay_signature) {
      booking.booking_status = "failed";
      booking.payment.status = "failed";
      await booking.save();
      return res.status(400).json({ message: "Payment verification failed. Invalid signature." });
    }

    // ── Check if the hold has expired (booking was auto-marked failed by holdManager) ──
    if (booking.booking_status === "failed") {
      // Signature is valid, so a real payment was made. Store details and trigger refund.
      console.warn(`[PaymentController] Expired booking ${booking._id} received a genuine payment. Triggering automatic refund.`);
      booking.payment.razorpay_payment_id = razorpay_payment_id;
      booking.payment.transaction_id      = razorpay_payment_id;
      booking.payment.status              = "paid"; // temporarily mark paid so refund works
      booking.cancellation = {
        cancelled_at:  new Date(),
        reason:        "Other",
        cancelled_by:  "admin",
        refund_amount: booking.total_amount,
        refund_status: "pending"
      };
      await booking.save();
      // Trigger immediate refund
      await processRefund(booking);
      return res.status(410).json({
        message: "Your slot hold expired before payment was completed. A full refund has been initiated automatically.",
        expired: true,
        refund_initiated: true
      });
    }

    booking.booking_status              = "confirmed";
    booking.payment.status              = "paid";
    booking.payment.razorpay_order_id   = razorpay_order_id;
    booking.payment.razorpay_payment_id = razorpay_payment_id;
    booking.payment.razorpay_signature  = razorpay_signature;
    booking.payment.transaction_id      = razorpay_payment_id;
    booking.payment.paid_at             = new Date();
    await booking.save();

    await Slot.updateMany(
      { _id: { $in: booking.slot_ids } },
      { $set: { status: "booked", booking_id: booking._id, held_until: null } }
    );

    try {
      const user = await User.findById(booking.user_id);
      if (user?.email) await sendBlueCardEmail({ to: user.email, name: user.name, booking });
    } catch (emailErr) { console.error("Blue card email failed:", emailErr.message); }

    res.status(200).json({
      message:        "Payment verified. Booking confirmed!",
      booking_id:     booking._id,
      booking_status: booking.booking_status,
      payment_status: booking.payment.status,
      paid_at:        booking.payment.paid_at,
      total_amount:   booking.total_amount,
    });
  } catch (error) {
    console.error("verifyPayment error:", error && error.stack ? error.stack : error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── Create Advance Payment Order (₹200) ─────────────────────────────────────
const createAdvanceOrder = async (req, res) => {
  try {
    const { booking_id } = req.body;
    const user_id = req.user._id;

    // Release expired holds first
    await releaseExpiredHolds();

    if (!booking_id) return res.status(400).json({ message: "booking_id is required" });

    const booking = await Booking.findOne({ _id: booking_id, user_id });
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Check if hold has expired
    if (booking.booking_status === "failed") {
      return res.status(410).json({
        message: "Your hold on the slot has expired (10-minute limit). Please start a new booking.",
        expired: true
      });
    }

    if (booking.booking_status !== "pending")
      return res.status(400).json({ message: `Cannot create advance order for booking with status: ${booking.booking_status}` });

    if (["paid", "advance_paid"].includes(booking.payment.status))
      return res.status(400).json({ message: "Advance already paid or booking fully paid" });

    const options = {
      amount:   ADVANCE_AMOUNT * 100, // ₹200 in paise
      currency: "INR",
      receipt:  `adv_${booking._id}`,
      notes: {
        booking_id:  booking._id.toString(),
        user_id:     user_id.toString(),
        type:        "advance",
      },
    };

  const order = await razorpay.orders.create(options);
    booking.payment.razorpay_order_id = order.id;
    booking.payment.payment_type = "advance";
    await booking.save();

    res.status(200).json({
      message:         "Advance order created",
      order_id:        order.id,
      amount:          order.amount,
      currency:        order.currency,
      booking_id:      booking._id,
      advance_amount:  ADVANCE_AMOUNT,
      razorpay_key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("createAdvanceOrder error:", error && error.stack ? error.stack : error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── Verify Advance Payment + Create Balance Payment Link ─────────────────────
const verifyAdvancePayment = async (req, res) => {
  try {
    const { booking_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const user_id = req.user._id;

    if (!booking_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature)
      return res.status(400).json({ message: "All payment fields are required" });

    const booking = await Booking.findOne({ _id: booking_id, user_id });
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.payment.razorpay_order_id !== razorpay_order_id)
      return res.status(400).json({ message: "Order ID mismatch" });

    // ── Signature verification (always do first to validate the payment is genuine) ──
    const body     = razorpay_order_id + "|" + razorpay_payment_id;
    const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(body).digest("hex");

    if (expected !== razorpay_signature) {
      booking.payment.status = "failed";
      await booking.save();
      return res.status(400).json({ message: "Advance payment verification failed." });
    }

    // ── Check if the hold has expired (booking was auto-failed by holdManager) ──
    if (booking.booking_status === "failed") {
      // Real payment received but hold expired — store details and refund immediately
      console.warn(`[PaymentController] Expired booking ${booking._id} received a genuine advance payment. Triggering automatic refund.`);
      booking.payment.razorpay_payment_id = razorpay_payment_id;
      booking.payment.transaction_id      = razorpay_payment_id;
      booking.payment.advance_amount      = ADVANCE_AMOUNT;
      booking.payment.status              = "paid"; // temporarily so refund works
      booking.cancellation = {
        cancelled_at:  new Date(),
        reason:        "Other",
        cancelled_by:  "admin",
        refund_amount: ADVANCE_AMOUNT,
        refund_status: "pending"
      };
      await booking.save();
      await processRefund(booking);
      return res.status(410).json({
        message: "Your slot hold expired before advance payment was completed. A full refund has been initiated automatically.",
        expired: true,
        refund_initiated: true
      });
    }

    // Mark advance as paid
    const balanceDue = booking.total_amount - ADVANCE_AMOUNT;
    booking.booking_status              = "confirmed";
    booking.payment.status              = "advance_paid";
    booking.payment.advance_amount      = ADVANCE_AMOUNT;
    booking.payment.advance_paid_at     = new Date();
    booking.payment.razorpay_payment_id = razorpay_payment_id;
    booking.payment.razorpay_signature  = razorpay_signature;

    // Create Razorpay Payment Link for the balance amount
    let balanceLinkUrl = null;
    try {
      const user = await User.findById(user_id);
      const backendBase = process.env.BACKEND_URL || `${req.protocol}://${req.get("host")}`;
      const paymentLinkOptions = {
        amount:      balanceDue * 100, // paise
        currency:    "INR",
        accept_partial: false,
        description: `Balance payment for booking #${booking._id.toString().slice(-8).toUpperCase()} at ${booking.turf_name_snapshot || 'Vega Sports'}`,
        customer: {
          name:  user?.name  || "Customer",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        notify: { sms: false, email: false }, // Set to false to avoid failure if not configured
        reminder_enable: false,
        notes: {
          booking_id: booking._id.toString(),
          type: "balance",
        },
        callback_url: `${backendBase}/api/payment/balance-webhook`,
        callback_method: "get",
      };

      // Razorpay requires contact if present, but can fail if empty string or repetitive digits.
      const contact = (paymentLinkOptions.customer.contact || "").replace(/\s/g, '');
      const isInvalid = !/^\+?\d{10,15}$/.test(contact) || /^(.)\1{9,}$/.test(contact);

      if (contact && isInvalid) {
        console.log(`[DEBUG] Stripping invalid contact for Razorpay: ${paymentLinkOptions.customer.contact}`);
        delete paymentLinkOptions.customer.contact;
      }

      const link = await razorpay.paymentLink.create(paymentLinkOptions);
      balanceLinkUrl = link.short_url;
      booking.payment.balance_link_id  = link.id;
      booking.payment.balance_link_url = link.short_url;
      console.log("Razorpay Balance Payment Link created:", balanceLinkUrl);
    } catch (linkErr) {
      console.error("CRITICAL: Payment link creation failed:", linkErr && linkErr.stack ? linkErr.stack : linkErr);
      // Continue without link — admin can still mark paid if needed
    }

    // Hold/confirm slots
    await Slot.updateMany(
      { _id: { $in: booking.slot_ids } },
      { $set: { status: "booked", booking_id: booking._id, held_until: null } }
    );

    await booking.save();

    // Send Red Card email
    try {
      const user = await User.findById(user_id);
      if (user?.email) await sendRedCardEmail({ to: user.email, name: user.name, booking });
    } catch (emailErr) { console.error("Red card email failed:", emailErr.message); }

    res.status(200).json({
      message:           "Advance payment verified. Booking confirmed!",
      booking_id:        booking._id,
      booking_status:    booking.booking_status,
      payment_status:    booking.payment.status,
      advance_amount:    ADVANCE_AMOUNT,
      balance_due:       balanceDue,
      balance_link_url:  balanceLinkUrl,
      total_amount:      booking.total_amount,
    });
  } catch (error) {
    console.error("verifyAdvancePayment error:", error && error.stack ? error.stack : error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── Balance Payment Webhook (Razorpay Payment Link callback) ─────────────────
const balanceWebhook = async (req, res) => {
  try {
    const { 
      razorpay_payment_link_id, 
      razorpay_payment_id, 
      razorpay_payment_link_status,
      razorpay_signature,
    } = req.query;

    // Razorpay webhooks are server-to-server — origin/referer headers are always empty.
    // Use the known production frontend URL directly.
    const frontendBase = process.env.FRONTEND_URL || "https://www.infinitysports-turf.com";

    if (razorpay_payment_link_status !== "paid") {
      return res.redirect(`${frontendBase}/payment-status?status=pending`);
    }

    const body = `${razorpay_payment_link_id}|${req.query.razorpay_payment_link_reference_id}|${razorpay_payment_link_status}|${razorpay_payment_id}`;
    const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(body).digest("hex");

    if (expected !== razorpay_signature) {
      return res.redirect(`${frontendBase}/payment-status?status=failed`);
    }

    const booking = await Booking.findOne({ "payment.balance_link_id": razorpay_payment_link_id });
    if (!booking) {
      return res.redirect(`${frontendBase}/payment-status?status=not_found`);
    }

    booking.payment.status          = "paid";
    booking.payment.balance_paid_at = new Date();
    booking.payment.paid_at         = new Date();
    booking.payment.transaction_id  = razorpay_payment_id;
    await booking.save();

    // Send Blue Card email
    try {
      const user = await User.findById(booking.user_id);
      if (user?.email) await sendBlueCardEmail({ to: user.email, name: user.name, booking });
    } catch (emailErr) { console.error("Blue card email failed:", emailErr.message); }

    res.redirect(`${frontendBase}/ticket/${booking._id}?paid=true`);
  } catch (error) {
    console.error("Balance webhook error:", error.message);
    const frontendBase = process.env.FRONTEND_URL || "https://www.infinitysports-turf.com";
    res.redirect(`${frontendBase}/payment-status?status=error`);
  }
};

// ─── Admin: Mark Booking Fully Paid ──────────────────────────────────────────
const markFullyPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const booking_id = id;
    
    console.log(`[ADMIN] markFullyPaid called for booking: ${booking_id}`);

    const booking = await Booking.findById(booking_id);
    if (!booking) {
      console.error(`[ADMIN] markFullyPaid: Booking not found: ${booking_id}`);
      return res.status(404).json({ message: "Booking not found" });
    }

    // Ensure payment object exists
    if (!booking.payment) {
      booking.payment = { status: "pending", gateway: "razorpay" };
    }

    if (booking.payment.status === "paid") {
      return res.status(400).json({ message: "Booking is already fully paid" });
    }

    // Update payment status
    booking.payment.status  = "paid";
    booking.payment.paid_at = new Date();
    if (!booking.payment.balance_paid_at) {
      booking.payment.balance_paid_at = new Date();
    }
    
    // CRITICAL: Update booking status to confirmed if it was pending
    if (booking.booking_status === "pending" || !booking.booking_status) {
      booking.booking_status = "confirmed";
    }

    await booking.save();

    // CRITICAL: Ensure all associated slots are marked as booked
    try {
      const slotResult = await Slot.updateMany(
        { _id: { $in: booking.slot_ids } },
        { $set: { status: "booked", booking_id: booking._id, held_until: null } }
      );
      console.log(`[ADMIN] Updated ${slotResult.modifiedCount} slots to 'booked' for booking ${booking._id}`);
    } catch (slotErr) {
      console.error(`[ADMIN] Failed to update slots for booking ${booking._id}:`, slotErr.message);
      // We don't return 500 here as the payment itself was recorded
    }

    // Send Blue Card email
    try {
      const user = await User.findById(booking.user_id);
      if (user?.email) {
        await sendBlueCardEmail({ to: user.email, name: user.name, booking });
        console.log(`[ADMIN] Blue Card email sent to ${user.email} for booking ${booking._id}`);
      }
    } catch (emailErr) {
      console.error(`[ADMIN] Blue card email failed for booking ${booking._id}:`, emailErr.message);
    }

    res.status(200).json({
      message:        "Booking marked as fully paid. Blue Card email sent.",
      booking_id:     booking._id,
      payment_status: booking.payment.status,
      booking_status: booking.booking_status,
    });
  } catch (error) {
    console.error("markFullyPaid error:", error && error.stack ? error.stack : error);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

const markPaidCash = async (req, res) => {
  try {
    const { id } = req.params;
    const booking_id = id;
    console.log(`[ADMIN] markPaidCash: Starting for booking: ${booking_id}`);

    const booking = await Booking.findById(booking_id);
    if (!booking) {
      console.log(`[ADMIN] markPaidCash: Booking ${booking_id} not found`);
      return res.status(404).json({ message: "Booking not found" });
    }

    // Update payment details for Cash
    booking.payment = {
      ...(booking.payment || {}),
      status: "paid",
      gateway: "cash",
      paid_at: new Date(),
      balance_paid_at: new Date()
    };
    
    if (booking.booking_status === "pending" || !booking.booking_status) {
      booking.booking_status = "confirmed";
    }

    await booking.save();
    console.log(`[ADMIN] markPaidCash: Booking ${booking_id} saved successfully`);

    // Update slots
    try {
      await Slot.updateMany(
        { _id: { $in: booking.slot_ids } },
        { $set: { status: "booked", booking_id: booking._id, held_until: null } }
      );
      console.log(`[ADMIN] markPaidCash: Slots updated for booking ${booking_id}`);
    } catch (slotErr) {
      console.error(`[ADMIN] Failed to update slots for cash payment:`, slotErr.message);
    }

    // Send Blue Card email
    try {
      const user = await User.findById(booking.user_id);
      if (user?.email) {
        console.log(`[ADMIN] markPaidCash: Sending Blue Card to ${user.email}`);
        await sendBlueCardEmail({ to: user.email, name: user.name, booking });
      }
    } catch (emailErr) {
      console.error(`[ADMIN] Blue card email failed for cash payment:`, emailErr.message);
    }

    res.status(200).json({
      message: "Booking marked as Paid via Cash.",
      booking_id: booking._id,
      payment_status: "paid",
      gateway: "cash"
    });
  } catch (error) {
    console.error(`[ADMIN] markPaidCash error:`, error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── Refund helper was moved to the top of the file so verifyPayment can call it.

module.exports = { createOrder, verifyPayment, createAdvanceOrder, verifyAdvancePayment, balanceWebhook, markFullyPaid, markPaidCash, processRefund };