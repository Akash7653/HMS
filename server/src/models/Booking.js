const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    hotel: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", required: true },
    roomType: { type: String, enum: ["Single", "Double", "Suite"], required: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    nights: { type: Number, required: true, min: 1 },
    guests: { type: Number, required: true, min: 1 },
    basePricePerNight: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
    paymentMethod: { type: String, enum: ["stripe", "razorpay-sim", "razorpay"], default: "stripe" },
    paymentReference: { type: String, default: "" },
    bookingStatus: { type: String, enum: ["confirmed", "cancelled"], default: "confirmed" },
    cancellationReason: { type: String, default: "" },
  },
  { timestamps: true }
);

// Indexes are automatically created by unique: true and required fields

module.exports = mongoose.model("Booking", bookingSchema);
