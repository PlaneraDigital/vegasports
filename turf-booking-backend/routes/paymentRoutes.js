const express = require("express");
const router  = express.Router();
const {
  createOrder,
  verifyPayment,
  createAdvanceOrder,
  verifyAdvancePayment,
  balanceWebhook,
  markFullyPaid,
} = require("../controllers/paymentController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// ─── Full Payment ─────────────────────────────────────────────────────────────
router.post("/create-order", protect, createOrder);
router.post("/verify",       protect, verifyPayment);

// ─── Advance Payment (₹200) ───────────────────────────────────────────────────
router.post("/create-advance-order", protect, createAdvanceOrder);
router.post("/verify-advance",       protect, verifyAdvancePayment);

// ─── Balance Payment Link Webhook (Razorpay GET callback) ────────────────────
router.get("/balance-webhook", balanceWebhook);

// ─── Admin: Mark Fully Paid ───────────────────────────────────────────────────
router.post("/mark-fully-paid/:booking_id", protect, adminOnly, markFullyPaid);

module.exports = router;