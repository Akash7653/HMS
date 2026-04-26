const mongoose = require("mongoose");

const refreshTokenSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  token: { 
    type: String, 
    required: true,
    unique: true 
  },
  deviceInfo: {
    userAgent: { type: String },
    ip: { type: String },
    device: { type: String },
    browser: { type: String },
    os: { type: String }
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  expiresAt: { 
    type: Date, 
    required: true 
  },
  lastUsedAt: { 
    type: Date, 
    default: Date.now 
  },
  revokedAt: { type: Date },
  revokeReason: { type: String }
}, { timestamps: true });

// Indexes are automatically created by unique: true and required fields

module.exports = mongoose.model("RefreshToken", refreshTokenSchema);
