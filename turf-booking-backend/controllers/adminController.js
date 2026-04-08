const bcrypt = require("bcryptjs");
const jwt    = require("jsonwebtoken");
const User   = require("../models/User");
const Turf   = require("../models/Turf");
const Slot   = require("../models/Slot");
const Booking = require("../models/Booking"); 

// ─── Generate Token ───────────────────────────────────────────────────────────
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );
};

// ══════════════════════════════════════════════════════════════════════════════
//  AUTH
// ══════════════════════════════════════════════════════════════════════════════

// ─── Admin Register ───────────────────────────────────────────────────────────
const adminRegister = async (req, res) => {
  try {
    const { name, email, phone, password, admin_secret_key } = req.body;

    if (!name || !email || !phone || !password || !admin_secret_key) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Verify secret key
    if (admin_secret_key !== process.env.ADMIN_SECRET_KEY) {
      return res.status(403).json({ message: "Invalid admin secret key" });
    }

    // Check if email exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const salt          = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create admin user
    const admin = await User.create({
      name,
      email,
      phone,
      role: "admin",
      auth: { password_hash },
    });

    const token = generateToken(admin._id);

    res.status(201).json({
      message: "Admin registered successfully",
      token,
      admin: {
        id:    admin._id,
        name:  admin.name,
        email: admin.email,
        role:  admin.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── Admin Login ──────────────────────────────────────────────────────────────
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user with admin role
    const admin = await User.findOne({ email, role: "admin" });
    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials or not an admin" });
    }

    if (admin.status !== "active") {
      return res.status(403).json({ message: "Admin account is suspended" });
    }

    const isMatch = await bcrypt.compare(password, admin.auth.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    admin.auth.last_login = new Date();
    await admin.save();

    const token = generateToken(admin._id);

    res.status(200).json({
      message: "Admin login successful",
      token,
      admin: {
        id:    admin._id,
        name:  admin.name,
        email: admin.email,
        role:  admin.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
//  TURF MANAGEMENT
// ══════════════════════════════════════════════════════════════════════════════

// ─── Add Turf ─────────────────────────────────────────────────────────────────
const addTurf = async (req, res) => {
  try {
    const {
      name, slug, turf_type, surface, slot_duration_minutes,
      price_per_hour, sports, location, amenities, images,
      operating_hours, pricing_overrides, rules,
    } = req.body;

    if (!name || !slug || !surface || !slot_duration_minutes || !price_per_hour) {
      return res.status(400).json({ message: "name, slug, surface, slot_duration_minutes and price_per_hour are required" });
    }

    // Check slug is unique
    const existing = await Turf.findOne({ slug });
    if (existing) {
      return res.status(400).json({ message: "Turf with this slug already exists" });
    }

    const turf = await Turf.create({
      name,
      slug,
      turf_type,
      surface,
      slot_duration_minutes,
      price_per_hour,
      sports:           sports           || [],
      location:         location         || {},
      amenities:        amenities        || {},
      images:           images           || [],
      operating_hours:  operating_hours  || {},
      pricing_overrides: pricing_overrides || {},
      rules:            rules            || [],
      owner_id:         req.user._id,
      status:           "active",
    });

    res.status(201).json({
      message: "Turf added successfully",
      turf,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── Edit Turf ────────────────────────────────────────────────────────────────
const editTurf = async (req, res) => {
  try {
    const turf = await Turf.findById(req.params.id);
    if (!turf) {
      return res.status(404).json({ message: "Turf not found" });
    }

    // Update only fields that are sent
    const allowedFields = [
      "name", "turf_type", "surface", "slot_duration_minutes",
      "price_per_hour", "sports", "location", "amenities",
      "images", "operating_hours", "pricing_overrides", "rules", "status",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        turf[field] = req.body[field];
      }
    });

    await turf.save();

    res.status(200).json({
      message: "Turf updated successfully",
      turf,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── Delete Turf ──────────────────────────────────────────────────────────────
const deleteTurf = async (req, res) => {
  try {
    const turf = await Turf.findById(req.params.id);
    if (!turf) {
      return res.status(404).json({ message: "Turf not found" });
    }

    // Soft delete — just mark as inactive
    turf.status = "inactive";
    await turf.save();

    res.status(200).json({ message: "Turf deleted (marked inactive) successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
//  SLOT MANAGEMENT
// ══════════════════════════════════════════════════════════════════════════════

// ─── Generate Slots for a Turf on a Date ─────────────────────────────────────
const generateSlots = async (req, res) => {
  try {
    const { turf_id, date, price, peak_hour_price, peak_start, peak_end } = req.body;

    if (!turf_id || !date || !price) {
      return res.status(400).json({ message: "turf_id, date and price are required" });
    }

    const turf = await Turf.findById(turf_id);
    if (!turf) {
      return res.status(404).json({ message: "Turf not found" });
    }

    // Get day of week from date
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const dayName  = dayNames[new Date(date).getDay()];
    const hours    = turf.operating_hours[dayName];

    if (!hours || hours.is_closed) {
      return res.status(400).json({ message: `Turf is closed on ${dayName}` });
    }

    const duration = turf.slot_duration_minutes; // e.g. 60

    // Parse open and close times
    const [openH,  openM]  = hours.open.split(":").map(Number);
    const [closeH, closeM] = hours.close.split(":").map(Number);

    let currentH = openH;
    let currentM = openM;

    const slotsToInsert = [];

    while (true) {
      const nextM = currentM + duration;
      let nextH   = currentH + Math.floor(nextM / 60);
      const remM  = nextM % 60;

      // Stop if next time exceeds closing time
      if (nextH > closeH || (nextH === closeH && remM > closeM)) break;

      const start = `${String(currentH).padStart(2, "0")}:${String(currentM).padStart(2, "0")}`;
      const end   = `${String(nextH).padStart(2, "0")}:${String(remM).padStart(2, "0")}`;

      // Determine price — peak or normal
      let slotPrice = price;
      if (peak_hour_price && peak_start && peak_end) {
        if (start >= peak_start && start < peak_end) {
          slotPrice = peak_hour_price;
        }
      }

      slotsToInsert.push({
        turf_id,
        date:       new Date(date),
        start_time: start,
        end_time:   end,
        price:      slotPrice,
        status:     "available",
      });

      currentH = nextH;
      currentM = remM;
    }

    if (slotsToInsert.length === 0) {
      return res.status(400).json({ message: "No slots could be generated. Check operating hours." });
    }

    // insertMany with ordered:false skips duplicates and inserts rest
    let inserted = [];
    let skipped  = 0;

    try {
      const result = await Slot.insertMany(slotsToInsert, { ordered: false });
      inserted = result;
    } catch (err) {
      if (err.code === 11000) {
        inserted = err.insertedDocs || [];
        skipped  = slotsToInsert.length - inserted.length;
      } else {
        throw err;
      }
    }

    res.status(201).json({
      message:  `Slots generated successfully`,
      date,
      total:    slotsToInsert.length,
      inserted: inserted.length,
      skipped,
      slots:    slotsToInsert.map((s) => ({
        start_time: s.start_time,
        end_time:   s.end_time,
        price:      s.price,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── Block / Unblock a Slot ───────────────────────────────────────────────────
const updateSlotStatus = async (req, res) => {
  try {
    const { status, blocked_reason } = req.body;
    const slot = await Slot.findById(req.params.id);

    if (!slot) {
      return res.status(404).json({ message: "Slot not found" });
    }

    // Cannot block an already booked slot
    if (slot.status === "booked" && status === "blocked") {
      return res.status(400).json({ message: "Cannot block an already booked slot" });
    }

    slot.status = status;
    slot.blocked_reason = status === "blocked" ? (blocked_reason || "Maintenance") : null;
    await slot.save();

    res.status(200).json({
      message: `Slot ${status} successfully`,
      slot,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── Get All Slots for a Turf on a Date (Admin View) ─────────────────────────
const getAdminSlots = async (req, res) => {
  try {
    const { turf_id, date } = req.query;

    if (!turf_id || !date) {
      return res.status(400).json({ message: "turf_id and date are required" });
    }

    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const slots = await Slot.find({
      turf_id,
      date: { $gte: startOfDay, $lte: endOfDay },
    }).sort({ start_time: 1 });

    const summary = {
      total:     slots.length,
      available: slots.filter((s) => s.status === "available").length,
      booked:    slots.filter((s) => s.status === "booked").length,
      on_hold:   slots.filter((s) => s.status === "on_hold").length,
      blocked:   slots.filter((s) => s.status === "blocked").length,
    };

    res.status(200).json({
      message: "Slots fetched successfully",
      date,
      summary,
      slots,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
// ══════════════════════════════════════════════════════════════════════════════
//  BOOKING MANAGEMENT
// ══════════════════════════════════════════════════════════════════════════════

// ─── Get All Bookings ─────────────────────────────────────────────────────────
const getAllBookings = async (req, res) => {
  try {
    const { status, turf_id, date, page = 1, limit = 10 } = req.query;

    const filter = {};

    if (status)  filter.booking_status = status;
    if (turf_id) filter.turf_id        = turf_id;
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setUTCHours(23, 59, 59, 999);
      filter.date = { $gte: startOfDay, $lte: endOfDay };
    }

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Booking.countDocuments(filter);

    const bookings = await Booking.find(filter)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("user_id",  "name email phone")
      .populate("turf_id",  "name location.city location.address")
      .populate("slot_ids", "start_time end_time price status");

    res.status(200).json({
      message: "Bookings fetched successfully",
      total,
      page:    Number(page),
      limit:   Number(limit),
      pages:   Math.ceil(total / Number(limit)),
      bookings,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── Get Single Booking (Admin) ───────────────────────────────────────────────
const getBookingByIdAdmin = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("user_id",  "name email phone")
      .populate("turf_id",  "name location.city location.address price_per_hour")
      .populate("slot_ids", "start_time end_time price status date");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.status(200).json({
      message: "Booking fetched successfully",
      booking,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── Cancel Booking (Admin) ───────────────────────────────────────────────────
const cancelBookingAdmin = async (req, res) => {
  try {
    const { reason } = req.body;
    const booking    = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (!["pending", "confirmed"].includes(booking.booking_status)) {
      return res.status(400).json({
        message: `Cannot cancel booking with status: ${booking.booking_status}`,
      });
    }

    // Free up slots
    await Slot.updateMany(
      { _id: { $in: booking.slot_ids } },
      {
        $set: {
          status:     "available",
          booked_by:  null,
          held_until: null,
          booking_id: null,
        },
      }
    );

    // Refund if already paid
    const refund_amount = booking.payment.status === "paid"
      ? booking.total_amount
      : 0;

    const refund_status = booking.payment.status === "paid"
      ? "pending"
      : "na";

    booking.booking_status   = "cancelled";
    booking.cancellation     = {
      cancelled_at:  new Date(),
      reason:        reason || "Other",
      cancelled_by:  "admin",
      refund_amount,
      refund_status,
    };
    await booking.save();

    res.status(200).json({
      message:        "Booking cancelled by admin successfully",
      booking_id:     booking._id,
      refund_amount,
      refund_status,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
//  PRICING MANAGEMENT
// ══════════════════════════════════════════════════════════════════════════════

// ─── Update Turf Pricing ──────────────────────────────────────────────────────
const updatePricing = async (req, res) => {
  try {
    const {
      price_per_hour,
      weekend_price,
      peak_hour_price,
      peak_start,
      peak_end,
    } = req.body;

    const turf = await Turf.findById(req.params.id);
    if (!turf) {
      return res.status(404).json({ message: "Turf not found" });
    }

    // Update base price
    if (price_per_hour !== undefined) {
      turf.price_per_hour = price_per_hour;
    }

    // Update pricing overrides
    if (weekend_price !== undefined) {
      turf.pricing_overrides.weekend_price = weekend_price;
    }
    if (peak_hour_price !== undefined) {
      turf.pricing_overrides.peak_hour_price = peak_hour_price;
    }
    if (peak_start !== undefined) {
      turf.pricing_overrides.peak_hours.start = peak_start;
    }
    if (peak_end !== undefined) {
      turf.pricing_overrides.peak_hours.end = peak_end;
    }

    await turf.save();

    res.status(200).json({
      message: "Pricing updated successfully",
      pricing: {
        price_per_hour:    turf.price_per_hour,
        pricing_overrides: turf.pricing_overrides,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── Update Slot Price Directly ───────────────────────────────────────────────
const updateSlotPrice = async (req, res) => {
  try {
    const { price } = req.body;

    if (!price) {
      return res.status(400).json({ message: "price is required" });
    }

    const slot = await Slot.findById(req.params.id);
    if (!slot) {
      return res.status(404).json({ message: "Slot not found" });
    }

    if (slot.status === "booked") {
      return res.status(400).json({ message: "Cannot update price of a booked slot" });
    }

    slot.price = price;
    await slot.save();

    res.status(200).json({
      message: "Slot price updated successfully",
      slot_id: slot._id,
      start_time: slot.start_time,
      end_time:   slot.end_time,
      new_price:  slot.price,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  // Auth
  adminRegister,
  adminLogin,

  // Turf Management
  addTurf,
  editTurf,
  deleteTurf,

  // Slot Management
  generateSlots,
  updateSlotStatus,
  getAdminSlots,

  // Booking Management
  getAllBookings,
  getBookingByIdAdmin,
  cancelBookingAdmin,

  // Pricing Management
  updatePricing,
  updateSlotPrice,
};