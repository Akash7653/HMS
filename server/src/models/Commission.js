const mongoose = require("mongoose");

const commissionSchema = new mongoose.Schema({
  vendor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Vendor", 
    required: true 
  },
  booking: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Booking", 
    required: true 
  },
  commissionAmount: { 
    type: Number, 
    required: true,
    min: 0
  },
  commissionRate: { 
    type: Number, 
    required: true,
    min: 0,
    max: 1
  },
  bookingAmount: { 
    type: Number, 
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ["pending", "available", "paid", "withheld"],
    default: "pending"
  },
  paymentDate: { type: Date },
  payoutId: { type: String }, // Reference to payout transaction
  notes: { type: String },
  holdUntil: { type: Date }, // When commission becomes available for payout
  calculatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Indexes are automatically created by unique: true and required fields

module.exports = mongoose.model("Commission", commissionSchema);
