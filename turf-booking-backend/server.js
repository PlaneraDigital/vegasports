const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

app.use(express.json()); // ← THIS must be BEFORE routes

// Routes
app.use("/api/auth", require("./routes/authRoutes"));

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Turf Booking API is running" });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});