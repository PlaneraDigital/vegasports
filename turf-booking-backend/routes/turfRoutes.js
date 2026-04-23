const express = require("express");
const router = express.Router();
const { getAllTurfs, getTurfById } = require("../controllers/turfController");
const { protect } = require("../middleware/authMiddleware");

// GET /        → public (anyone can browse)
// GET /:id     → public (anyone can view turf details)
router.get("/",    getAllTurfs);
router.get("/:id", getTurfById);

module.exports = router;