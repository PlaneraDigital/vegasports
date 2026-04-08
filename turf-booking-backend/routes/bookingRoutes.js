const express = require("express");
const router  = express.Router();
const {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking,
  getUpcomingBookings,
  getBookingHistory,
} = require("../controllers/bookingController");
const { protect } = require("../middleware/authMiddleware");

router.post("/",             protect, createBooking);
router.get("/",              protect, getUserBookings);
router.get("/upcoming",      protect, getUpcomingBookings);  // ← new
router.get("/history",       protect, getBookingHistory);    // ← new
router.get("/:id",           protect, getBookingById);
router.put("/:id/cancel",    protect, cancelBooking);

module.exports = router;