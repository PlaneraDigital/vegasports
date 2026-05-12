const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    profile_photo: {
      type: String,
      default: null,
    },
    dob: {
      type: Date,
      default: null,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other", null],
      default: null,
    },
    location: {
      city:    { type: String, default: "" },
      state:   { type: String, default: "" },
      pincode: { type: String, default: "" },
    },
    preferred_sports: {
      type: [String],
      enum: ["football", "cricket", "badminton", "tennis", "basketball"],
      default: [],
    },
    wallet: {
      balance:      { type: Number, default: 0 },
      currency:     { type: String, default: "INR" },
      last_updated: { type: Date, default: Date.now },
    },
    auth: {
      password_hash: { type: String, required: true },
      last_login:    { type: Date, default: null },
    },
    booking_ids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking",
      },
    ],
    role: {
      type:    String,
      enum:    ["user", "admin", "receptionist"],
      default: "user",
    },
    status: {
      type: String,
      enum: ["active", "suspended", "deleted"],
      default: "active",
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

module.exports = mongoose.model("User", userSchema, "profiles");