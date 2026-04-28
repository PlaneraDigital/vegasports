const Slot = require("../models/Slot");
const Turf = require("../models/Turf");

// ─── Helper: validate HH:MM format ───────────────────────────────────────────
const isValidTime = (t) =>
  typeof t === "string" && /^\d{2}:\d{2}$/.test(t.trim());

// ─── Helper: format minutes to HH:MM ─────────────────────────────────────────
const formatTime = (mins) => {
  const normalized = mins % (24 * 60);
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

// ─── Helper: Check if two time ranges overlap ────────────────────────────────
const isOverlapping = (s1, e1, s2, e2) => {
  const toMins = (t) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const start1 = toMins(s1);
  const end1   = toMins(e1);
  const start2 = toMins(s2);
  const end2   = toMins(e2);

  // Range 1 is [start1, end1], Range 2 is [start2, end2]
  // Overlap if (start1 < end2) AND (start2 < end1)
  return start1 < end2 && start2 < end1;
};

// ─── Get Slots by Turf ID and Date ────────────────────────────────────────────
const getSlotsByTurfAndDate = async (req, res) => {
  try {
    const { turf_id, date } = req.query;

    if (!turf_id || !date) {
      return res.status(400).json({ message: "turf_id and date are required" });
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD" });
    }

    const turf = await Turf.findById(turf_id);
    if (!turf) {
      return res.status(404).json({ message: "Turf not found" });
    }

    const [y, m, d] = date.split("-").map(Number);
    const startOfDay = new Date(Date.UTC(y, m - 1, d));
    const endOfDay   = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));

    // ── Fetch existing booked/held slots for overlap checking ────────────────
    const existingBookedSlots = await Slot.find({
      turf_id,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ["booked", "on_hold", "blocked"] }
    });

    // ── Morning/Evening price helper ──────────────────────────────────────────
    const MORNING_START = 7 * 60;
    const MORNING_END   = 19 * 60;
    const getPriceForSlot = (startMinutes) => {
      const normMins = startMinutes % 1440;
      if (normMins >= MORNING_START && normMins < MORNING_END) {
        return turf.pricing?.morning?.price ?? turf.price_per_hour;
      }
      return turf.pricing?.evening?.price ?? turf.price_per_hour;
    };

    // ── IST Time Check for is_past ────────────────────────────────────────────
    const nowIST      = new Date(Date.now() + 330 * 60 * 1000);
    const todayISTStr = `${nowIST.getUTCFullYear()}-${String(nowIST.getUTCMonth() + 1).padStart(2, "0")}-${String(nowIST.getUTCDate()).padStart(2, "0")}`;
    const isToday     = date === todayISTStr;
    const nowMinsIST  = nowIST.getUTCHours() * 60 + nowIST.getUTCMinutes();

    // ── Slot Generation Settings ──────────────────────────────────────────────
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const dayName = days[startOfDay.getUTCDay()];
    const schedule = turf.operating_hours ? turf.operating_hours[dayName] : null;
    
    const duration = turf.slot_duration_minutes || 60;
    const interval = turf.slot_interval_minutes || 30; // Step by 30 mins even if 1hr long

    let finalSlots = [];

    if (schedule && !schedule.is_closed) {
      const openStr  = (schedule.open  || "").trim();
      const closeStr = (schedule.close || "").trim();
      const is24Hours = openStr === "00:00" && closeStr === "00:00";

      if (is24Hours || (isValidTime(openStr) && isValidTime(closeStr))) {
        let startMin, endMin;
        if (is24Hours) {
          startMin = 0; endMin = 1440;
        } else {
          const [oH, oM] = openStr.split(":").map(Number);
          const [cH, cM] = closeStr.split(":").map(Number);
          startMin = oH * 60 + oM;
          endMin   = cH * 60 + cM;
          if (endMin <= startMin) endMin += 1440;
        }

        // Loop using INTERVAL (30 mins) but create slots of DURATION (60 mins)
        for (let tM = startMin; tM + duration <= endMin; tM += interval) {
          const sT = formatTime(tM);
          const eT = formatTime(tM + duration);

          // Check if this slot overlaps with ANY booked slot
          const overlap = existingBookedSlots.find(booked => 
            isOverlapping(sT, eT, booked.start_time, booked.end_time)
          );

          // Find exact match in DB if it exists
          const exact = existingBookedSlots.find(s => s.start_time === sT);

          let status = "available";
          let booked_by = null;
          let _id = `temp-${sT}`;

          if (exact) {
            status = exact.status;
            booked_by = exact.booked_by;
            _id = exact._id;

            // Show user's own on_hold slots as available
            if (status === "on_hold" && booked_by && req.user && booked_by.toString() === req.user._id.toString()) {
              status = "available";
            }
          } else if (overlap) {
            // If it overlaps with a booking but isn't the booking itself, mark it as blocked/booked
            status = "booked"; // Or "blocked"
          }

          finalSlots.push({
            _id,
            turf_id: turf._id,
            date: startOfDay,
            start_time: sT,
            end_time: eT,
            price: getPriceForSlot(tM),
            status,
            is_past: isToday && (tM <= nowMinsIST),
            is_temp: !exact
          });
        }
      }
    }

    res.status(200).json({
      message: "Slots fetched successfully",
      turf: { name: turf.name, pricing: turf.pricing },
      date,
      slots: finalSlots,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { getSlotsByTurfAndDate };