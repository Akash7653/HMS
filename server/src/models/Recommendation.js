const mongoose = require("mongoose");

const recommendationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  hotel: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", required: true },
  score: { type: Number, required: true, min: 0, max: 1 },
  reason: {
    type: String,
    enum: ["similar_to_viewed", "similar_to_booked", "popular_in_area", "trending", "price_match", "amenity_match"],
    required: true
  },
  context: {
    similarHotelId: mongoose.Schema.Types.ObjectId,
    searchQuery: String,
    behaviorScore: Number,
    popularityScore: Number,
    priceScore: Number
  },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } // 7 days
}, { timestamps: true });

recommendationSchema.index({ user: 1, score: -1 });
recommendationSchema.index({ hotel: 1, reason: 1 });
recommendationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Recommendation", recommendationSchema);
