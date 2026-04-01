const Slot = require("../models/Slot");
const Turf = require("../models/Turf");

// ─── Get Slots by Turf ID and Date ────────────────────────────────────────────
const getSlotsByTurfAndDate = async (req, res) => {
  try {
    const { turf_id, date } = req.query;

    // Validate required params
    if (!turf_id || !date) {
      return res.status(400).json({
        message: "turf_id and date are required",
      });
    }

    // Validate date format (YYYY-MM-DD)
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD" });
    }

    // Check turf exists
    const turf = await Turf.findById(turf_id);
    if (!turf) {
      return res.status(404).json({ message: "Turf not found" });
    }

    // Set date range for the full day (00:00 to 23:59)
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Auto-expire on_hold slots whose held_until has passed
    await Slot.updateMany(
      {
        turf_id,
        status: "on_hold",
        held_until: { $lt: new Date() },
      },
      {
        $set: {
          status:     "available",
          held_until: null,
          booked_by:  null,
        },
      }
    );

    // Fetch slots
    const slots = await Slot.find({
      turf_id,
      date: { $gte: startOfDay, $lte: endOfDay },
    }).sort({ start_time: 1 });

    // Summary count
    const summary = {
      total:     slots.length,
      available: slots.filter((s) => s.status === "available").length,
      booked:    slots.filter((s) => s.status === "booked").length,
      on_hold:   slots.filter((s) => s.status === "on_hold").length,
      blocked:   slots.filter((s) => s.status === "blocked").length,
    };

    res.status(200).json({
      message: "Slots fetched successfully",
      turf: {
        id:                   turf._id,
        name:                 turf.name,
        price_per_hour:       turf.price_per_hour,
        slot_duration_minutes: turf.slot_duration_minutes,
      },
      date,
      summary,
      slots,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { getSlotsByTurfAndDate };