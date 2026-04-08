const express = require("express");
const router  = express.Router();
const {
  adminRegister,
  adminLogin,
  addTurf,
  editTurf,
  deleteTurf,
  generateSlots,
  updateSlotStatus,
  getAdminSlots,
  getAllBookings,
  getBookingByIdAdmin,
  cancelBookingAdmin,
  updatePricing,
  updateSlotPrice,
} = require("../controllers/adminController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// ─── Auth ─────────────────────────────────────────────────────────────────────
router.post("/register", adminRegister);
router.post("/login",    adminLogin);

// ─── Turf Management ──────────────────────────────────────────────────────────
router.post("/turfs",       protect, adminOnly, addTurf);
router.put("/turfs/:id",    protect, adminOnly, editTurf);
router.delete("/turfs/:id", protect, adminOnly, deleteTurf);

// ─── Slot Management ──────────────────────────────────────────────────────────
router.post("/slots/generate",  protect, adminOnly, generateSlots);
router.put("/slots/:id/status", protect, adminOnly, updateSlotStatus);
router.put("/slots/:id/price",  protect, adminOnly, updateSlotPrice);
router.get("/slots",            protect, adminOnly, getAdminSlots);

// ─── Booking Management ───────────────────────────────────────────────────────
router.get("/bookings",              protect, adminOnly, getAllBookings);
router.get("/bookings/:id",          protect, adminOnly, getBookingByIdAdmin);
router.put("/bookings/:id/cancel",   protect, adminOnly, cancelBookingAdmin);

// ─── Pricing Management ───────────────────────────────────────────────────────
router.put("/turfs/:id/pricing", protect, adminOnly, updatePricing);

module.exports = router;