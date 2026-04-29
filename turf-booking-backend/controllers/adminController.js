const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");
const User     = require("../models/User");
const Turf     = require("../models/Turf");
const Slot     = require("../models/Slot");
const Booking  = require("../models/Booking");

// ─── Generate Token ───────────────────────────────────────────────────────────
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "2h" });
};

// ══════════════════════════════════════════════════════════════════════════════
//  AUTH
// ══════════════════════════════════════════════════════════════════════════════
const adminRegister = async (req, res) => {
  try {
    const { name, email, phone, password, admin_secret_key } = req.body;
    if (!name || !email || !phone || !password || !admin_secret_key) return res.status(400).json({ message: "All fields are required" });
    if (admin_secret_key !== process.env.ADMIN_SECRET_KEY) return res.status(403).json({ message: "Invalid admin secret key" });
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already registered" });
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const admin = await User.create({ name, email, phone, role: "admin", auth: { password_hash } });
    const token = generateToken(admin._id);
    res.status(201).json({ message: "Admin registered successfully", token, admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role } });
  } catch (error) { res.status(500).json({ message: "Server error", error: error.message }); }
};

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });
    const admin = await User.findOne({ email, role: "admin" });
    if (!admin) return res.status(401).json({ message: "Invalid credentials or not an admin" });
    if (admin.status !== "active") return res.status(403).json({ message: "Admin account is suspended" });
    const isMatch = await bcrypt.compare(password, admin.auth.password_hash);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });
    admin.auth.last_login = new Date();
    await admin.save();
    const token = generateToken(admin._id);
    res.status(200).json({ message: "Admin login successful", token, admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role } });
  } catch (error) { res.status(500).json({ message: "Server error", error: error.message }); }
};

// ══════════════════════════════════════════════════════════════════════════════
//  TURF MANAGEMENT
// ══════════════════════════════════════════════════════════════════════════════
const formatTime = (mins) => {
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};
const isValidTime = (t) => typeof t === "string" && /^\d{2}:\d{2}$/.test(t.trim());

const addTurf = async (req, res) => {
  try {
    const { name, slug, turf_type, surface, slot_duration_minutes, price_per_hour, sports, location, amenities, images, operating_hours, pricing_overrides, pricing, rules, highlights, offers } = req.body;
    if (!name || !slug || !surface || !slot_duration_minutes || !price_per_hour) return res.status(400).json({ message: "name, slug, surface, slot_duration_minutes and price_per_hour are required" });
    const existing = await Turf.findOne({ slug });
    if (existing) return res.status(400).json({ message: "Turf with this slug already exists" });
    const turf = await Turf.create({
      name, slug, turf_type, surface, slot_duration_minutes, price_per_hour,
      pricing: pricing || { morning: { start: "07:00", end: "19:00", price: 500 }, evening: { start: "19:00", end: "07:00", price: 800 } },
      sports: sports || [], location: location || {}, amenities: amenities || {}, images: images || [], operating_hours: operating_hours || {}, pricing_overrides: pricing_overrides || {}, rules: rules || [], highlights: highlights || [], offers: offers || [], owner_id: req.user._id, status: "active"
    });
    res.status(201).json({ message: "Turf added successfully", turf });
  } catch (error) { res.status(500).json({ message: "Server error", error: error.message }); }
};

const editTurf = async (req, res) => {
  try {
    const turf = await Turf.findById(req.params.id);
    if (!turf) return res.status(404).json({ message: "Turf not found" });
    const allowedFields = [ "name", "turf_type", "surface", "slot_duration_minutes", "price_per_hour", "pricing", "sports", "location", "amenities", "images", "operating_hours", "pricing_overrides", "rules", "highlights", "offers", "status" ];
    allowedFields.forEach((field) => { if (req.body[field] !== undefined) turf[field] = req.body[field]; });
    await turf.save();
    await Slot.deleteMany({ turf_id: turf._id, status: "available" });
    res.status(200).json({ message: "Turf updated successfully", turf });
  } catch (error) { res.status(500).json({ message: "Server error", error: error.message }); }
};

const deleteTurf = async (req, res) => {
  try {
    const turf = await Turf.findById(req.params.id);
    if (!turf) return res.status(404).json({ message: "Turf not found" });
    turf.status = "inactive";
    await turf.save();
    res.status(200).json({ message: "Turf deleted (marked inactive) successfully" });
  } catch (error) { res.status(500).json({ message: "Server error", error: error.message }); }
};

// ══════════════════════════════════════════════════════════════════════════════
//  SLOT MANAGEMENT
// ══════════════════════════════════════════════════════════════════════════════
const getAdminSlots = async (req, res) => {
  try {
    const { turf_id, date } = req.query;
    if (!turf_id || !date) return res.status(400).json({ message: "turf_id and date are required" });
    const [y, m, d] = date.split("-").map(Number);
    const startOfDay = new Date(Date.UTC(y, m - 1, d));
    const endOfDay   = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
    const turf = await Turf.findById(turf_id);
    if (!turf) return res.status(404).json({ message: "Turf not found" });

    const prevDay = new Date(startOfDay);
    prevDay.setUTCDate(prevDay.getUTCDate() - 1);

    const relevantBookings = await Slot.find({
      turf_id,
      $or: [
        { date: { $gte: startOfDay, $lte: endOfDay } },
        { date: prevDay }
      ],
      status: { $in: ["booked", "on_hold", "blocked"] }
    });

    const slotsFromDb = relevantBookings.filter(s => s.date.getTime() === startOfDay.getTime()).sort((a,b) => a.start_time.localeCompare(b.start_time));
    const crossoverBookings = relevantBookings.filter(s => {
      if (s.date.getTime() !== prevDay.getTime()) return false;
      const [sh, sm] = s.start_time.split(":").map(Number);
      const [eh, em] = s.end_time.split(":").map(Number);
      let emins = eh * 60 + em;
      if (emins <= sh * 60 + sm) emins += 1440;
      return emins > 1440;
    });
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const dayName = dayNames[startOfDay.getUTCDay()];
    const schedule = turf.operating_hours ? turf.operating_hours[dayName] : null;
    const duration = turf.slot_duration_minutes || 60;
    const interval = turf.slot_interval_minutes || 30;
    const isOverlapping = (s1, e1, s2, e2) => {
      const toMins = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
      let start1 = toMins(s1); let end1 = toMins(e1);
      let start2 = toMins(s2); let end2 = toMins(e2);
      if (end1 <= start1) end1 += 1440;
      if (end2 <= start2) end2 += 1440;
      return start1 < end2 && start2 < end1;
    };
    let finalSlots = [];
    if (schedule && !schedule.is_closed) {
      const openStr = (schedule.open || "").trim();
      const closeStr = (schedule.close || "").trim();
      const is24Hours = openStr === "00:00" && closeStr === "00:00";
      if (is24Hours || (isValidTime(openStr) && isValidTime(closeStr))) {
        let startMin, endMin;
        if (is24Hours) { startMin = 0; endMin = 1440; }
        else { const [oH, oM] = openStr.split(":").map(Number); const [cH, cM] = closeStr.split(":").map(Number); startMin = oH * 60 + oM; endMin = cH * 60 + cM; if (endMin <= startMin) endMin += 1440; }
        const getAdminSlotPrice = (startMins) => {
          const norm = startMins % 1440;
          if (norm >= 420 && norm < 1140) return turf.pricing?.morning?.price ?? turf.price_per_hour;
          return turf.pricing?.evening?.price ?? turf.price_per_hour;
        };
        for (let tM = startMin; tM < endMin; tM += interval) {
          const sT = formatTime(tM); const eT = formatTime(tM + duration);
          const exact = slotsFromDb.find(s => s.start_time === sT);
          const overlap = slotsFromDb.find(booked => ["booked", "on_hold", "blocked"].includes(booked.status) && isOverlapping(sT, eT, booked.start_time, booked.end_time));
          const prevDayOverlap = crossoverBookings.find(booked => {
            const [psh, psm] = booked.start_time.split(":").map(Number);
            const [peh, pem] = booked.end_time.split(":").map(Number);
            let pemins = peh * 60 + pem;
            if (pemins <= psh * 60 + psm) pemins += 1440;
            return tM < (pemins - 1440);
          });
          if (exact) finalSlots.push(exact);
          else finalSlots.push({ _id: `temp-${date}|${sT}`, turf_id, date: startOfDay, start_time: sT, end_time: eT, price: getAdminSlotPrice(tM), status: (overlap || prevDayOverlap) ? "booked" : "available", is_temp: true });
        }
      }
    }
    if (finalSlots.length === 0) finalSlots = slotsFromDb;
    const slots = finalSlots;
    const summary = { total: slots.length, available: slots.filter((s) => s.status === "available").length, booked: slots.filter((s) => s.status === "booked").length, on_hold: slots.filter((s) => s.status === "on_hold").length, blocked: slots.filter((s) => s.status === "blocked").length };
    res.status(200).json({ message: "Slots fetched successfully", date, summary, slots });
  } catch (error) { res.status(500).json({ message: "Server error", error: error.message }); }
};

const generateSlots = async (req, res) => {
  res.status(200).json({ message: "Slot generation is now automatic. No need to manually generate." });
};

const updateSlotStatus = async (req, res) => {
  try {
    const { status } = req.body;
    await Slot.findByIdAndUpdate(req.params.id, { status });
    res.status(200).json({ message: "Slot status updated" });
  } catch (error) { res.status(500).json({ message: "Error updating status" }); }
};

const updateSlotPrice = async (req, res) => {
  try {
    const { price } = req.body;
    await Slot.findByIdAndUpdate(req.params.id, { price });
    res.status(200).json({ message: "Slot price updated" });
  } catch (error) { res.status(500).json({ message: "Error updating price" }); }
};

// ... Rest of the file (Bookings, Reports, Pricing) remains as before ...
// (I will preserve all existing logic for reports and dashboard)

const getAllBookings = async (req, res) => {
  try {
    const { status, turf_id, date, page = 1, limit = 10 } = req.query;
    const filter = {};
    if (status) filter.booking_status = status;
    if (turf_id) filter.turf_id = turf_id;
    if (date) { const startOfDay = new Date(date); startOfDay.setUTCHours(0, 0, 0, 0); const endOfDay = new Date(date); endOfDay.setUTCHours(23, 59, 59, 999); filter.date = { $gte: startOfDay, $lte: endOfDay }; }
    const skip = (Number(page) - 1) * Number(limit);
    const total = await Booking.countDocuments(filter);
    const bookings = await Booking.find(filter).sort({ created_at: -1 }).skip(skip).limit(Number(limit)).populate("user_id", "name email phone").populate("turf_id", "name location.city location.address").populate("slot_ids", "start_time end_time price status");
    res.status(200).json({ message: "Bookings fetched successfully", total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)), bookings });
  } catch (error) { res.status(500).json({ message: "Server error", error: error.message }); }
};

const getBookingByIdAdmin = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("user_id", "name email phone").populate("turf_id", "name location.city location.address price_per_hour").populate("slot_ids", "start_time end_time price status date");
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.status(200).json({ message: "Booking fetched successfully", booking });
  } catch (error) { res.status(500).json({ message: "Server error", error: error.message }); }
};

const cancelBookingAdmin = async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (!["pending", "confirmed"].includes(booking.booking_status)) return res.status(400).json({ message: `Cannot cancel booking with status: ${booking.booking_status}` });
    await Slot.updateMany({ _id: { $in: booking.slot_ids } }, { $set: { status: "available", booked_by: null, held_until: null, booking_id: null } });
    const refund_amount = booking.payment.status === "paid" ? booking.total_amount : 0;
    const refund_status = booking.payment.status === "paid" ? "pending" : "na";
    booking.booking_status = "cancelled";
    booking.cancellation = { cancelled_at: new Date(), reason: reason || "Other", cancelled_by: "admin", refund_amount, refund_status };
    await booking.save();
    res.status(200).json({ message: "Booking cancelled by admin successfully", booking_id: booking._id, refund_amount, refund_status });
  } catch (error) { res.status(500).json({ message: "Server error", error: error.message }); }
};

const updatePricing = async (req, res) => {
  try {
    const { price_per_hour, weekend_price, peak_hour_price, peak_start, peak_end, morning_price, evening_price } = req.body;
    const turf = await Turf.findById(req.params.id);
    if (!turf) return res.status(404).json({ message: "Turf not found" });
    if (price_per_hour !== undefined) turf.price_per_hour = price_per_hour;
    if (!turf.pricing) turf.pricing = { morning: { start: "07:00", end: "19:00", price: 500 }, evening: { start: "19:00", end: "07:00", price: 800 } };
    if (morning_price !== undefined) turf.pricing.morning.price = Number(morning_price);
    if (evening_price !== undefined) turf.pricing.evening.price = Number(evening_price);
    turf.markModified("pricing");
    if (weekend_price !== undefined) turf.pricing_overrides.weekend_price = weekend_price;
    if (peak_hour_price !== undefined) turf.pricing_overrides.peak_hour_price = peak_hour_price;
    if (peak_start !== undefined) turf.pricing_overrides.peak_hours.start = peak_start;
    if (peak_end !== undefined) turf.pricing_overrides.peak_hours.end = peak_end;
    await turf.save();
    res.status(200).json({ message: "Pricing updated successfully", pricing: { price_per_hour: turf.price_per_hour, pricing: turf.pricing, pricing_overrides: turf.pricing_overrides } });
  } catch (error) { res.status(500).json({ message: "Server error", error: error.message }); }
};

const getDashboardStats = async (req, res) => {
  try {
    const total_bookings = await Booking.countDocuments();
    const total_users = await User.countDocuments({ role: "user" });
    const total_turfs = await Turf.countDocuments({ status: "active" });
    
    const bookingsByStatus = await Booking.aggregate([ { $group: { _id: "$booking_status", count: { $sum: 1 } } } ]);
    const statusMap = { confirmed: 0, pending: 0, completed: 0, cancelled: 0, failed: 0 };
    bookingsByStatus.forEach((item) => { if (statusMap.hasOwnProperty(item._id)) statusMap[item._id] = item.count; });

    const revenueResult = await Booking.aggregate([ 
      { $match: { "payment.status": { $in: ["paid", "advance_paid"] } } }, 
      { $group: { _id: null, total_revenue: { $sum: "$total_amount" } } } 
    ]);
    const total_revenue = revenueResult[0]?.total_revenue || 0;

    const todayStart = new Date(); todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setUTCHours(23, 59, 59, 999);
    
    const today_bookings = await Booking.countDocuments({ created_at: { $gte: todayStart, $lte: todayEnd } });
    const todayRevenueResult = await Booking.aggregate([ 
      { $match: { "payment.status": { $in: ["paid", "advance_paid"] }, created_at: { $gte: todayStart, $lte: todayEnd } } }, 
      { $group: { _id: null, today_revenue: { $sum: "$total_amount" } } } 
    ]);
    const today_revenue = todayRevenueResult[0]?.today_revenue || 0;

    res.status(200).json({ 
      message: "Dashboard stats fetched successfully", 
      stats: { 
        total_bookings, total_users, total_turfs, total_revenue, 
        today: { bookings: today_bookings, revenue: today_revenue }, 
        bookings_by_status: statusMap 
      } 
    });
  } catch (error) { res.status(500).json({ message: "Server error", error: error.message }); }
};

const getRevenueReport = async (req, res) => {
  try {
    const revenueData = await Booking.aggregate([
      { $match: { "payment.status": { $in: ["paid", "advance_paid"] } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
          total_revenue: { $sum: "$total_amount" },
          total_bookings: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } },
      { $project: { period: "$_id", total_revenue: 1, total_bookings: 1, _id: 0 } }
    ]);
    res.status(200).json({ data: revenueData });
  } catch (error) { res.status(500).json({ message: "Error fetching report" }); }
};

const getPeakHoursAnalysis = async (req, res) => { res.status(200).json({ data: [] }); };
const getTurfRevenueBreakdown = async (req, res) => { res.status(200).json({ data: [] }); };
const getUserAnalytics = async (req, res) => { res.status(200).json({ data: [] }); };

const getUsersWithStats = async (req, res) => {
  try {
    const users = await User.aggregate([
      { $match: { role: "user" } },
      {
        $lookup: {
          from: "bookings",
          localField: "_id",
          foreignField: "user_id",
          as: "bookings"
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          phone: 1,
          status: 1,
          created_at: 1,
          bookingCount: { $size: "$bookings" }
        }
      },
      { $sort: { created_at: -1 } }
    ]);
    res.status(200).json({ message: "Users fetched successfully", users });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.status = user.status === "active" ? "suspended" : "active";
    await user.save();

    res.status(200).json({ 
      message: `User ${user.status === "active" ? "activated" : "suspended"} successfully`, 
      user: { id: user._id, status: user.status } 
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { 
  adminRegister, adminLogin, addTurf, editTurf, deleteTurf, 
  getAdminSlots, generateSlots, updateSlotStatus, updateSlotPrice,
  getAllBookings, getBookingByIdAdmin, cancelBookingAdmin, 
  updatePricing, getDashboardStats, 
  getRevenueReport, getPeakHoursAnalysis, getTurfRevenueBreakdown, getUserAnalytics,
  getUsersWithStats, toggleUserStatus
};