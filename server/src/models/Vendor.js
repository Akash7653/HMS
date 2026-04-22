const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true,
    unique: true 
  },
  businessName: { 
    type: String, 
    required: true,
    trim: true 
  },
  businessType: {
    type: String,
    enum: ["individual", "company", "chain"],
    default: "individual"
  },
  registrationNumber: {
    type: String,
    trim: true
  },
  taxId: {
    type: String,
    trim: true
  },
  contactInfo: {
    phone: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true }
  },
  bankDetails: {
    accountNumber: { type: String },
    bankName: { type: String },
    ifscCode: { type: String },
    accountHolderName: { type: String }
  },
  commissionSettings: {
    commissionRate: { type: Number, default: 0.15, min: 0, max: 0.5 }, // 15% default
    paymentCycle: {
      type: String,
      enum: ["weekly", "biweekly", "monthly"],
      default: "monthly"
    },
    minimumPayout: { type: Number, default: 1000 },
    holdPeriod: { type: Number, default: 7 } // Days to hold payments
  },
  verificationStatus: {
    type: String,
    enum: ["pending", "verified", "rejected", "suspended"],
    default: "pending"
  },
  verificationDocuments: [{
    type: { type: String, required: true }, // "pan", "gst", "address_proof", etc.
    url: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    }
  }],
  performanceMetrics: {
    totalRevenue: { type: Number, default: 0 },
    totalBookings: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    cancellationRate: { type: Number, default: 0 },
    responseRate: { type: Number, default: 0 },
    lastActiveAt: { type: Date, default: Date.now }
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  suspendedAt: { type: Date },
  suspensionReason: { type: String }
}, { timestamps: true });

vendorSchema.index({ user: 1 });
vendorSchema.index({ "verificationStatus": 1 });
vendorSchema.index({ "performanceMetrics.totalRevenue": -1 });

module.exports = mongoose.model("Vendor", vendorSchema);
