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
} = require("../controllers/adminController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// ─── Auth ─────────────────────────────────────────────────────────────────────
router.post("/register", adminRegister);
router.post("/login",    adminLogin);

// ─── Turf Management ──────────────────────────────────────────────────────────
router.post("/turfs",        protect, adminOnly, addTurf);
router.put("/turfs/:id",     protect, adminOnly, editTurf);
router.delete("/turfs/:id",  protect, adminOnly, deleteTurf);

// ─── Slot Management ──────────────────────────────────────────────────────────
router.post("/slots/generate",      protect, adminOnly, generateSlots);
router.put("/slots/:id/status",     protect, adminOnly, updateSlotStatus);
router.get("/slots",                protect, adminOnly, getAdminSlots);

module.exports = router;