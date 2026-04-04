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

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    message: "Turf Booking API is running",
    version: "1.0.0",
    endpoints: {
      auth:     "/api/auth",
      turfs:    "/api/turfs",
      slots:    "/api/slots",
      bookings: "/api/bookings",
      payment:  "/api/payment",
    },
  });
});

// ─── Error Handling (must be LAST) ───────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});