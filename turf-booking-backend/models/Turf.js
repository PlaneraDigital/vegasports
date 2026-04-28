const mongoose = require("mongoose");

const turfSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },

    turf_type: {
      type: String,
      enum: ["multi-purpose", "football-only", "cricket-only", "badminton-only"],
      required: false,
    },
    surface: {
      type: String,
      enum: ["artificial_grass", "natural_grass", "concrete", "clay"],
      required: true,
    },

    slot_duration_minutes: {
      type: Number,
      enum: [30, 60, 90, 120],
      required: true,
    },
    slot_interval_minutes: {
      type: Number,
      default: 30, // Starts a new slot every 30 mins by default
    },
    price_per_hour: { type: Number, required: true },
    currency: { type: String, default: "INR" },

    // Morning / Evening rate tiers
    pricing: {
      morning: {
        start: { type: String, default: "07:00" }, // HH:MM — start of morning window
        end:   { type: String, default: "19:00" }, // HH:MM — end of morning window
        price: { type: Number, default: 500  },
      },
      evening: {
        start: { type: String, default: "19:00" }, // HH:MM — start of evening window
        end:   { type: String, default: "07:00" }, // HH:MM — wraps midnight
        price: { type: Number, default: 800  },
      },
    },

    sports: {
      type: [String],
      enum: ["football", "cricket", "badminton", "tennis", "basketball"],
    },

    location: {
      address: { type: String },
      city: { type: String },
      state: { type: String },
      pincode: { type: String },
      coordinates: {
        type: { type: String },
        coordinates: { type: [Number], default: undefined },
      },
    },

    amenities: {
      floodlights: { type: Boolean, default: false },
      parking: { type: Boolean, default: false },
      washroom: { type: Boolean, default: false },
      changing_room: { type: Boolean, default: false },
      drinking_water: { type: Boolean, default: false },
      professional_surface: { type: Boolean, default: false },
      safe_premises: { type: Boolean, default: false },
      equipment_rental: { type: Boolean, default: false },
      cafeteria: { type: Boolean, default: false },
    },

    images: [
      {
        url: { type: String },
        label: {
          type: String,
          enum: ["main", "exterior", "night-view", "aerial", "changing-room"],
        },
        is_primary: { type: Boolean, default: false },
      },
    ],

    // open: "00:00" and close: "00:00" means 24 hours open
    operating_hours: {
      monday: { open: String, close: String, is_closed: { type: Boolean, default: false } },
      tuesday: { open: String, close: String, is_closed: { type: Boolean, default: false } },
      wednesday: { open: String, close: String, is_closed: { type: Boolean, default: false } },
      thursday: { open: String, close: String, is_closed: { type: Boolean, default: false } },
      friday: { open: String, close: String, is_closed: { type: Boolean, default: false } },
      saturday: { open: String, close: String, is_closed: { type: Boolean, default: false } },
      sunday: { open: String, close: String, is_closed: { type: Boolean, default: false } },
    },

    pricing_overrides: {
      weekend_price: { type: Number, default: null },
      peak_hour_price: { type: Number, default: null },
      peak_hours: {
        start: { type: String, default: null },
        end: { type: String, default: null },
      },
    },

    rules: [{ type: String }],

    highlights: [
      {
        title: { type: String, required: true },
        description: { type: String, required: true },
      }
    ],

    rating: {
      average: { type: Number, default: 0 },
      total_reviews: { type: Number, default: 0 },
    },

    owner_id: { type: mongoose.Schema.Types.ObjectId, default: null },

    status: {
      type: String,
      enum: ["active", "inactive", "pending_approval", "suspended"],
      default: "active",
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

module.exports = mongoose.model("Turf", turfSchema, "turfs");