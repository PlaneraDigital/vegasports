const Turf = require("../models/Turf");

// ─── Get All Turfs ────────────────────────────────────────────────────────────
const getAllTurfs = async (req, res) => {
  try {
    const { city, sport, surface } = req.query;

    // Build filter object dynamically without ANY status restrictions
    const filter = {};

    if (city)    filter["location.city"]  = { $regex: city, $options: "i" };
    if (sport)   filter["sports"]         = { $in: [sport] };
    if (surface) filter["surface"]        = surface;

    const turfs = await Turf.find(filter).select(
      "name slug turf_type surface sports location.city location.address price_per_hour rating amenities images slot_duration_minutes"
    );

    res.status(200).json({
      message: "Turfs fetched successfully",
      count: turfs.length,
      turfs,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── Get Single Turf ──────────────────────────────────────────────────────────
const getTurfById = async (req, res) => {
  try {
    const turf = await Turf.findById(req.params.id);

    if (!turf) {
      return res.status(404).json({ message: "Turf not found" });
    }

    if (turf.status !== "active") {
      return res.status(400).json({ message: "Turf is not available" });
    }

    res.status(200).json({
      message: "Turf fetched successfully",
      turf,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { getAllTurfs, getTurfById };