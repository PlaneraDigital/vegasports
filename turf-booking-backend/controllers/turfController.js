const Turf = require("../models/Turf");

// ─── Get All Turfs ────────────────────────────────────────────────────────────
const getAllTurfs = async (req, res) => {
  try {
    const { city, sport, surface } = req.query;

    const filter = {};

    if (city) filter["location.city"] = { $regex: city, $options: "i" };
    if (sport) filter["sports"] = { $in: [sport] };
    if (surface) filter["surface"] = surface;

    // ── Removed .select() so ALL fields including
    //    operating_hours and pricing_overrides are returned ──────────────────
    const turfs = await Turf.find(filter);

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

    res.status(200).json({
      message: "Turf fetched successfully",
      turf,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { getAllTurfs, getTurfById };