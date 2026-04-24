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

// ─── Get Slots by Turf ID and Date ────────────────────────────────────────────
const getSlotsByTurfAndDate = async (req, res) => {
  try {
    const { turf_id, date } = req.query;

    // ── Validate required params ──────────────────────────────────────────────
    if (!turf_id || !date) {
      return res.status(400).json({
        message: "turf_id and date are required",
      });
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        message: "Invalid date format. Use YYYY-MM-DD",
      });
    }

    // ── Find turf ─────────────────────────────────────────────────────────────
    const turf = await Turf.findById(turf_id);
    if (!turf) {
      return res.status(404).json({ message: "Turf not found" });
    }

    // ── Day range ─────────────────────────────────────────────────────────────
    const [y, m, d] = date.split("-").map(Number);
    const startOfDay = new Date(Date.UTC(y, m - 1, d));
    const endOfDay   = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));

    // ── Auto-expire stale on_hold slots ───────────────────────────────────────
    await Slot.updateMany(
      {
        turf_id,
        status: "on_hold",
        held_until: { $lt: new Date() },
      },
      {
        $set: {
          status: "available",
          held_until: null,
          booked_by: null,
          booking_id: null,
        },
      }
    );

    // ── Fetch existing slots ──────────────────────────────────────────────────
    let slots = await Slot.find({
      turf_id,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    // ── Full Schedule Logic ───────────────────────────────────────────────────
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const dayName = days[startOfDay.getUTCDay()];
    const schedule = turf.operating_hours ? turf.operating_hours[dayName] : null;
    const duration = turf.slot_duration_minutes;

    let finalSlots = [];

    if (schedule && !schedule.is_closed && duration > 0) {
      const openStr = (schedule.open || "").trim();
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
          endMin = cH * 60 + cM;
          if (endMin <= startMin) endMin += 1440;
        }

        // Pricing Overrides
        const overrides = turf.pricing_overrides || {};
        const isWeekend = dayName === "saturday" || dayName === "sunday";
        const weekendPrice = overrides.weekend_price;
        const peakPrice = overrides.peak_hour_price;
        const peakHours = overrides.peak_hours || {};
        let psM = -1, peM = -1;
        if (peakHours.start && peakHours.end && isValidTime(peakHours.start) && isValidTime(peakHours.end)) {
          const [sH, sM] = peakHours.start.split(":").map(Number);
          const [eH, eM] = peakHours.end.split(":").map(Number);
          psM = sH * 60 + sM; peM = eH * 60 + eM;
          if (peM <= psM) peM += 1440;
        }

        // Generate the template slots
        for (let tM = startMin; tM + duration <= endMin; tM += duration) {
          const sT = formatTime(tM);
          const eT = formatTime(tM + duration);
          
          // Check if it exists in DB
          const existing = slots.find(s => s.start_time === sT);
          if (existing) {
            finalSlots.push(existing);
          } else {
            // Determine price
            let price = turf.price_per_hour;
            if (isWeekend && weekendPrice) price = weekendPrice;
            if (psM !== -1 && peakPrice) {
              const norm = tM % 1440;
              const isPeak = peM > 1440 ? (norm >= psM || norm < (peM - 1440)) : (norm >= psM && norm < peM);
              if (isPeak) price = peakPrice;
            }
            finalSlots.push({
              _id: `temp-${sT}`,
              turf_id: turf._id,
              date: startOfDay,
              start_time: sT,
              end_time: eT,
              price,
              status: "available",
              is_temp: true // Flag to identify it's not in DB yet
            });
          }
        }
      }
    }

    if (finalSlots.length === 0) finalSlots = slots; // fallback if no schedule found

    // Update slots variable for sorting
    slots = finalSlots;

    // ── Sort slots by opening time ────────────────────────────────────────────
    const sched = turf.operating_hours?.[dayName];

    const openStr = (sched?.open || "").trim();
    const closeStr = (sched?.close || "").trim();

    const is24Hours = openStr === "00:00" && closeStr === "00:00";

    // For 24h or invalid times — sort from 00:00 (openTotal = 0)
    let openTotal = 0;

    if (!is24Hours && isValidTime(openStr)) {
      const [openH, openM] = openStr.split(":").map(Number);
      openTotal = openH * 60 + openM;
    }

    slots.sort((a, b) => {
      const toMins = (timeStr) => {
        if (!isValidTime(timeStr)) return 0;
        const [h, m] = timeStr.split(":").map(Number);
        let total = h * 60 + m;
        if (total < openTotal) total += 24 * 60;
        return total;
      };
      return toMins(a.start_time) - toMins(b.start_time);
    });

    // ── Map Slots for Current User ────────────────────────────────────────────
    const mappedSlots = slots.map((s) => {
      const slotObj = typeof s.toObject === "function" ? s.toObject() : s;
      if (
        slotObj.status === "on_hold" &&
        slotObj.booked_by &&
        req.user &&
        slotObj.booked_by.toString() === req.user._id.toString()
      ) {
        slotObj.status = "available";
      }
      return slotObj;
    });

    // ── Summary ───────────────────────────────────────────────────────────────
    const summary = {
      total: mappedSlots.length,
      available: mappedSlots.filter((s) => s.status === "available").length,
      booked: mappedSlots.filter((s) => s.status === "booked").length,
      on_hold: mappedSlots.filter((s) => s.status === "on_hold").length,
      blocked: mappedSlots.filter((s) => s.status === "blocked").length,
    };

    res.status(200).json({
      message: "Slots fetched successfully",
      turf: {
        id: turf._id,
        name: turf.name,
        price_per_hour: turf.price_per_hour,
        slot_duration_minutes: turf.slot_duration_minutes,
      },
      date,
      summary,
      slots: mappedSlots,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { getSlotsByTurfAndDate };