const mongoose = require("mongoose");

const userBehaviorSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { 
    type: String, 
    enum: ["search", "view", "wishlist", "booking", "click"], 
    required: true 
  },
  hotel: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel" },
  searchData: {
    city: String,
    state: String,
    checkIn: Date,
    checkOut: Date,
    guests: Number,
    roomType: String,
    priceRange: {
      min: Number,
      max: Number
    },
    amenities: [String],
    rating: Number
  },
  timestamp: { type: Date, default: Date.now },
  sessionId: { type: String, required: true },
  duration: Number, // Time spent on page in seconds
  device: String,
  userAgent: String
}, { timestamps: true });

userBehaviorSchema.index({ user: 1, timestamp: -1 });
userBehaviorSchema.index({ type: 1, timestamp: -1 });
userBehaviorSchema.index({ hotel: 1, type: 1 });
userBehaviorSchema.index({ "searchData.city": 1, timestamp: -1 });

module.exports = mongoose.model("UserBehavior", userBehaviorSchema);
