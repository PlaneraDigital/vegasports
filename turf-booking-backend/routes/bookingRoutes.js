const express = require("express");
const router = express.Router();
const {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking,
  getUpcomingBookings,
  getBookingHistory,
  downloadInvoice,
} = require("../controllers/bookingController");
const { protect } = require("../middleware/authMiddleware");


router.post("/", protect, createBooking);
router.get("/", protect, getUserBookings);
router.get("/upcoming", protect, getUpcomingBookings);
router.get("/history", protect, getBookingHistory);
router.get("/:id", protect, getBookingById);
router.put("/:id/cancel", protect, cancelBooking);
router.get("/:id/invoice", protect, downloadInvoice);

module.exports = router;
