const express = require("express");
const router  = express.Router();
const {
  createBooking,
  confirmBookingDirect,
  getUserBookings,
  getBookingById,
  cancelBooking,
} = require("../controllers/bookingController");
const { protect } = require("../middleware/authMiddleware");


// All routes are protected
router.post("/",              protect, createBooking);
router.post("/confirm-direct", protect, confirmBookingDirect);
router.get("/",               protect, getUserBookings);
router.get("/:id",            protect, getBookingById);
router.put("/:id/cancel",     protect, cancelBooking);

module.exports = router;