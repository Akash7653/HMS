const mongoose = require("mongoose");

const roomTypeSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["Single", "Double", "Suite"], required: true },
    basePrice: { type: Number, required: true, min: 1 },
    totalRooms: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const budgetGuidanceSchema = new mongoose.Schema(
  {
    tier: { type: String, trim: true },
    nightlyRange: { type: String, trim: true },
    note: { type: String, trim: true },
  },
  { _id: false }
);

const hotelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    location: {
      state: { type: String, trim: true, default: "Unknown" },
      city: { type: String, required: true, trim: true },
      address: { type: String, required: true, trim: true },
      country: { type: String, required: true, trim: true },
      coordinates: {
        lat: { type: Number, default: 20.5937 },
        lng: { type: Number, default: 78.9629 },
      },
    },
    amenities: [{ type: String }],
    images: [{ type: String }],
    ratingAverage: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },
    roomTypes: [roomTypeSchema],
    guestPolicy: {
      rules: {
        type: [String],
        default: [
          "Standard check-in is after 12:00 PM and check-out is before 11:00 AM.",
          "Outside visitors are not allowed in guest rooms after 10:00 PM.",
          "Smoking is only allowed in designated areas.",
          "Any property damage will be charged as per hotel policy.",
        ],
      },
      eligibilityNote: {
        type: String,
        default: "Guest must be at least 18 years old at check-in. Indian citizens should carry a valid government-issued ID.",
      },
      foreignGuestNote: {
        type: String,
        default: "If you are not an Indian citizen, bring your passport and valid visa/OCI documents for verification.",
      },
      requiredDocuments: {
        type: [String],
        default: [
          "Government photo ID (Aadhaar / Passport / Driving License / Voter ID).",
          "Booking confirmation details (SMS/Email or app booking screen).",
          "For foreign guests: Valid passport and visa/OCI documents.",
        ],
      },
      vacationPlanning: {
        type: [String],
        default: [
          "Weekday stays usually have better pricing than weekends.",
          "Book 2-4 weeks in advance for best inventory and rates.",
          "Choose room type based on trip purpose: work, family, or leisure.",
        ],
      },
      budgetGuidance: {
        type: [budgetGuidanceSchema],
        default: [
          { tier: "Budget", nightlyRange: "Rs. 2500 - Rs. 5000", note: "Good for short city trips and practical stays." },
          { tier: "Comfort", nightlyRange: "Rs. 5000 - Rs. 9000", note: "Balanced option for families and business travelers." },
          { tier: "Luxury", nightlyRange: "Rs. 9000+", note: "Premium amenities, views, and curated experiences." },
        ],
      },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

hotelSchema.index({ "location.city": 1, ratingAverage: -1 });

module.exports = mongoose.model("Hotel", hotelSchema);
