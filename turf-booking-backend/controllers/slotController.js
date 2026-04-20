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
    let slots = await Slot.find({
      turf_id,
      date: { $gte: startOfDay, $lte: endOfDay },
    }).sort({ start_time: 1 });

    // Auto-generate if empty
    if (slots.length === 0 && turf.operating_hours) {
      const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      const dayName = days[startOfDay.getUTCDay()];
      const daySchedule = turf.operating_hours[dayName];
      const slotDuration = turf.slot_duration_minutes;

      if (daySchedule && !daySchedule.is_closed && daySchedule.open && daySchedule.close && slotDuration) {
        const [openH, openM]   = daySchedule.open.split(":").map(Number);
        const [closeH, closeM] = daySchedule.close.split(":").map(Number);
        
        let startMinutes = openH * 60 + openM;
        let endMinutes   = closeH * 60 + closeM;
        if (endMinutes <= startMinutes) endMinutes += 24 * 60; // Next morning overlap

        const newSlots = [];
        const { weekend_price, peak_hour_price, peak_hours } = turf.pricing_overrides || {};
        
        let peakStartMin = -1, peakEndMin = -1;
        if (peak_hours && peak_hours.start && peak_hours.end) {
            const [psH, psM] = peak_hours.start.split(":").map(Number);
            peakStartMin = psH * 60 + psM;
            const [peH, peM] = peak_hours.end.split(":").map(Number);
            peakEndMin = peH * 60 + peM;
            if (peakEndMin <= peakStartMin) peakEndMin += 24 * 60;
        }

        for (let m = startMinutes; m + slotDuration <= endMinutes; m += slotDuration) {
           const formatM = (mins) => {
               const hm = mins % (24 * 60);
               return `${String(Math.floor(hm/60)).padStart(2, "0")}:${String(hm%60).padStart(2, "0")}`;
           };

           let price = turf.price_per_hour;
           const isWeekend = dayName === "saturday" || dayName === "sunday";
           if (isWeekend && weekend_price) price = weekend_price;

           if (peak_hour_price && peakStartMin !== -1) {
              const currentSm = m % (24 * 60);
              if (currentSm >= peakStartMin && currentSm < peakEndMin) {
                 price = peak_hour_price;
              }
           }

           newSlots.push({
               turf_id: turf._id,
               date: startOfDay,
               start_time: formatM(m),
               end_time: formatM(m + slotDuration),
               price: price,
               status: "available"
           });
        }

        if (newSlots.length > 0) {
            await Slot.insertMany(newSlots);
            slots = await Slot.find({
              turf_id,
              date: { $gte: startOfDay, $lte: endOfDay },
            }).sort({ start_time: 1 });
        }
      }
    }

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