const express = require("express");
const router = express.Router();
const { getAllTurfs, getTurfById } = require("../controllers/turfController");
const { protect } = require("../middleware/authMiddleware");

// Both routes are protected — user must be logged in
router.get("/", getAllTurfs);
router.get("/:id", protect, getTurfById);

module.exports = router;