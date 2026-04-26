const mongoose = require("mongoose");

const pageViewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  sessionId: { type: String, required: true },
  page: { type: String, required: true },
  referrer: { type: String },
  userAgent: { type: String },
  ip: { type: String },
  timestamp: { type: Date, default: Date.now },
  duration: { type: Number }, // Time spent on page in seconds
  device: { type: String },
  browser: { type: String },
  os: { type: String }
}, { _id: false });

const eventSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  sessionId: { type: String, required: true },
  eventType: { 
    type: String, 
    enum: ["click", "search", "filter", "booking", "wishlist", "review", "payment", "login", "signup"],
    required: true 
  },
  eventData: { type: mongoose.Schema.Types.Mixed },
  page: { type: String },
  timestamp: { type: Date, default: Date.now },
  ip: { type: String },
  userAgent: { type: String }
}, { _id: false });

const conversionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  sessionId: { type: String, required: true },
  conversionType: { 
    type: String, 
    enum: ["booking_completed", "signup_completed", "first_booking"],
    required: true 
  },
  value: { type: Number }, // Monetary value
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
  timestamp: { type: Date, default: Date.now },
  journeySteps: [{
    step: { type: String },
    timestamp: { type: Date, default: Date.now },
    duration: { type: Number }
  }]
}, { _id: false });

const analyticsSchema = new mongoose.Schema({
  date: { 
    type: Date, 
    required: true
  },
  pageViews: [pageViewSchema],
  events: [eventSchema],
  conversions: [conversionSchema],
  summary: {
    totalPageViews: { type: Number, default: 0 },
    uniqueVisitors: { type: Number, default: 0 },
    totalSessions: { type: Number, default: 0 },
    avgSessionDuration: { type: Number, default: 0 },
    bounceRate: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    totalBookings: { type: Number, default: 0 },
    topPages: [{ page: String, views: Number }],
    topEvents: [{ eventType: String, count: Number }],
    deviceBreakdown: [{
      device: String,
      count: Number,
      percentage: Number
    }],
    trafficSources: [{
      source: String,
      count: Number,
      percentage: Number
    }]
  }
}, { timestamps: true });

// Indexes are automatically created by unique: true and required fields

module.exports = mongoose.model("Analytics", analyticsSchema);
