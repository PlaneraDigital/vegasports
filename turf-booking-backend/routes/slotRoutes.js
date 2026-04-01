const express = require("express");
const router  = express.Router();
const { getSlotsByTurfAndDate } = require("../controllers/slotController");
const { protect } = require("../middleware/authMiddleware");

// GET /api/slots?turf_id=xxx&date=2026-03-27
router.get("/", protect, getSlotsByTurfAndDate);

module.exports = router;