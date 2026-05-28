const express = require("express");
const router  = express.Router();
const multer  = require("multer");
const {
  adminRegister,
  adminLogin,
  receptionistRegister,
  receptionistLogin,
  addTurf,
  editTurf,
  deleteTurf,
  generateSlots,
  updateSlotStatus,
  getAdminSlots,
  getAllBookings,
  getBookingByIdAdmin,
  cancelBookingAdmin,
  updatePricing,
  updateSlotPrice,
  getDashboardStats,
  getRevenueReport,
  getPeakHoursAnalysis,
  getTurfRevenueBreakdown,
  getUserAnalytics,
  getUsersWithStats,
  toggleUserStatus,
} = require("../controllers/adminController");
const { markFullyPaid, markPaidCash } = require("../controllers/paymentController");
const { protect, adminOnly, adminOrReceptionist } = require("../middleware/authMiddleware");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// ─── Cloudinary Config ────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "vegasports_turfs",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
    transformation: [{ width: 1200, height: 800, crop: "limit" }], // Quality optimization
  },
});

const upload = multer({ storage });

// ─── Auth ─────────────────────────────────────────────────────────────────────
router.post("/register", adminRegister);
router.post("/login",    adminLogin);
router.post("/receptionist/register", receptionistRegister);
router.post("/receptionist/login",    receptionistLogin);

// ─── Turf Management ──────────────────────────────────────────────────────────
router.post("/turfs",            protect, adminOnly, addTurf);
router.put("/turfs/:id",         protect, adminOnly, editTurf);
router.delete("/turfs/:id",      protect, adminOnly, deleteTurf);
router.put("/turfs/:id/pricing", protect, adminOnly, updatePricing);

router.post("/upload", protect, adminOnly, upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  
  // Use path or secure_url (depending on multer-storage-cloudinary version)
  const imageUrl = req.file.path || req.file.secure_url || req.file.url;

  res.status(200).json({
    message: "Image uploaded to Cloudinary successfully",
    url: imageUrl,
    filename: req.file.filename
  });
});

// ─── Slot Management ──────────────────────────────────────────────────────────
router.post("/slots/generate",   protect, adminOrReceptionist, generateSlots);
router.put("/slots/:id/status",  protect, adminOnly, updateSlotStatus);
router.put("/slots/:id/price",   protect, adminOrReceptionist, updateSlotPrice);
router.get("/slots",             protect, adminOrReceptionist, getAdminSlots);

// ─── Booking Management (admin + receptionist) ───────────────────────────────
router.get("/bookings",            protect, adminOrReceptionist, getAllBookings);
router.get("/bookings/:id",        protect, adminOrReceptionist, getBookingByIdAdmin);
router.put("/bookings/:id/cancel", protect, adminOrReceptionist, cancelBookingAdmin);
router.post("/pay-online/:id", protect, adminOrReceptionist, markFullyPaid);
router.post("/pay-cash/:id",   protect, adminOrReceptionist, markPaidCash);

// ─── User Management ──────────────────────────────────────────────────────────
router.get("/users",             protect, adminOnly, getUsersWithStats);
router.patch("/users/:id/status", protect, adminOnly, toggleUserStatus);

// ─── Dashboard + Reports ──────────────────────────────────────────────────────
router.get("/dashboard",              protect, adminOnly, getDashboardStats);
router.get("/reports/revenue",        protect, adminOnly, getRevenueReport);
router.get("/reports/peak-hours",     protect, adminOnly, getPeakHoursAnalysis);
router.get("/reports/turf-revenue",   protect, adminOnly, getTurfRevenueBreakdown);
router.get("/reports/user-analytics", protect, adminOnly, getUserAnalytics);

module.exports = router;