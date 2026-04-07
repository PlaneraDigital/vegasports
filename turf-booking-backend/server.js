const express   = require("express");
const dotenv    = require("dotenv");
const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

dotenv.config();
connectDB();

const app = express();
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth",     require("./routes/authRoutes"));
app.use("/api/turfs",    require("./routes/turfRoutes"));
app.use("/api/slots",    require("./routes/slotRoutes"));
app.use("/api/bookings", require("./routes/bookingRoutes"));
app.use("/api/payment",  require("./routes/paymentRoutes"));
app.use("/api/admin",    require("./routes/adminRoutes")); // ← new

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    message: "Turf Booking API is running",
    version: "1.0.0",
  });
});

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});