const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", default: null },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    hotel: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    paymentMethod: { type: String, enum: ["stripe", "razorpay-sim", "razorpay"], required: true },
    provider: { type: String, enum: ["stripe", "razorpay"], required: true },
    status: { type: String, enum: ["paid", "refunded", "failed"], default: "paid" },
    reference: { type: String, required: true },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

paymentSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Payment", paymentSchema);
