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
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

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

    // ── Auto-generate slots if none exist ─────────────────────────────────────
    if (slots.length === 0 && turf.operating_hours) {
      const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      const dayName = days[startOfDay.getUTCDay()];
      const schedule = turf.operating_hours[dayName];
      const duration = turf.slot_duration_minutes;

      if (schedule && !schedule.is_closed && duration) {
        const openStr = (schedule.open || "").trim();
        const closeStr = (schedule.close || "").trim();

        // ── 24 hour detection ─────────────────────────────────────────────────
        const is24Hours = openStr === "00:00" && closeStr === "00:00";

        // ── Guard: if not 24h and times are invalid — return empty ────────────
        if (!is24Hours && (!isValidTime(openStr) || !isValidTime(closeStr))) {
          return res.status(200).json({
            message: "Slots fetched successfully",
            turf: {
              id: turf._id,
              name: turf.name,
              price_per_hour: turf.price_per_hour,
              slot_duration_minutes: turf.slot_duration_minutes,
            },
            date,
            summary: {
              total: 0,
              available: 0,
              booked: 0,
              on_hold: 0,
              blocked: 0,
            },
            slots: [],
          });
        }

        // ── Calculate start and end minutes ───────────────────────────────────
        let startMin;
        let endMin;

        if (is24Hours) {
          startMin = 0;
          endMin = 24 * 60; // 1440 = full day
        } else {
          const [openH, openM] = openStr.split(":").map(Number);
          const [closeH, closeM] = closeStr.split(":").map(Number);

          startMin = openH * 60 + openM;
          endMin = closeH * 60 + closeM;

          // Overnight turf e.g. 22:00 → 02:00
          if (endMin <= startMin) endMin += 24 * 60;
        }

        // ── Pricing setup ─────────────────────────────────────────────────────
        const overrides = turf.pricing_overrides || {};
        const weekendPrice = overrides.weekend_price || null;
        const peakPrice = overrides.peak_hour_price || null;
        const peakHours = overrides.peak_hours || {};

        let peakStartMin = -1;
        let peakEndMin = -1;

        if (
          peakHours.start && peakHours.end &&
          isValidTime(peakHours.start) && isValidTime(peakHours.end)
        ) {
          const [psH, psM] = peakHours.start.split(":").map(Number);
          const [peH, peM] = peakHours.end.split(":").map(Number);
          peakStartMin = psH * 60 + psM;
          peakEndMin = peH * 60 + peM;
          if (peakEndMin <= peakStartMin) peakEndMin += 24 * 60;
        }

        const isWeekend = dayName === "saturday" || dayName === "sunday";

        // ── Check if slot falls in peak hours ─────────────────────────────────
        const isPeakSlot = (slotStartMin) => {
          if (peakStartMin === -1 || !peakPrice) return false;
          const normalized = slotStartMin % (24 * 60);
          if (peakEndMin > 24 * 60) {
            return (
              normalized >= peakStartMin ||
              normalized < (peakEndMin - 24 * 60)
            );
          }
          return normalized >= peakStartMin && normalized < peakEndMin;
        };

        // ── Generate all slots ────────────────────────────────────────────────
        const newSlots = [];

        for (let m = startMin; m + duration <= endMin; m += duration) {
          let price = turf.price_per_hour;

          if (isWeekend && weekendPrice) price = weekendPrice;
          if (isPeakSlot(m)) price = peakPrice;

          newSlots.push({
            turf_id: turf._id,
            date: startOfDay,
            start_time: formatTime(m),
            end_time: formatTime(m + duration),
            price,
            status: "available",
          });
        }

        // ── Insert, safely skip duplicates ────────────────────────────────────
        if (newSlots.length > 0) {
          try {
            await Slot.insertMany(newSlots, { ordered: false });
          } catch (err) {
            // 11000 = duplicate key — safe to ignore
            if (err.code !== 11000) {
              const nonDupErrors = (err.writeErrors || []).filter(
                (e) => e.code !== 11000
              );
              if (nonDupErrors.length > 0) throw err;
            }
          }

          // Refresh slots after insert
          slots = await Slot.find({
            turf_id,
            date: { $gte: startOfDay, $lte: endOfDay },
          });
        }
      }
    }

    // ── Sort slots by opening time ────────────────────────────────────────────
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const dayName = days[new Date(date).getUTCDay()];
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

    // ── Summary ───────────────────────────────────────────────────────────────
    const summary = {
      total: slots.length,
      available: slots.filter((s) => s.status === "available").length,
      booked: slots.filter((s) => s.status === "booked").length,
      on_hold: slots.filter((s) => s.status === "on_hold").length,
      blocked: slots.filter((s) => s.status === "blocked").length,
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
      slots,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { getSlotsByTurfAndDate };