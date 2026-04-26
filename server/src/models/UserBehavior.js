const mongoose = require("mongoose");

const pageViewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  page: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  duration: Number, // Time spent on page in seconds
  device: String,
  userAgent: String
}, { timestamps: true });

const eventSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  type: { type: String, required: true }, // 'page_view', 'search', 'booking', etc.
  timestamp: { type: Date, default: Date.now },
  sessionId: { type: String, required: true },
  duration: Number, // Time spent on page in seconds
  device: String,
  userAgent: String
}, { timestamps: true });

const conversionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  type: { type: String, required: true }, // 'booking', 'registration', etc.
  timestamp: { type: Date, default: Date.now },
  sessionId: { type: String, required: true },
  duration: Number, // Time spent on page in seconds
  device: String,
  userAgent: String
}, { timestamps: true });

const journeyStepSchema = new mongoose.Schema({
  step: { type: String },
  timestamp: { type: Date, default: Date.now },
  duration: { type: Number }
}, { _id: false });

const userBehaviorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  sessionId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  duration: Number, // Time spent on page in seconds
  device: String,
  userAgent: String
}, { timestamps: true });

// Indexes are automatically created by unique: true and required fields

module.exports = mongoose.model("UserBehavior", userBehaviorSchema);
