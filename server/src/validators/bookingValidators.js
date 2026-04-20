const { body } = require("express-validator");

exports.createBookingValidator = [
  body("hotelId").isMongoId().withMessage("Valid hotelId required"),
  body("roomType").isIn(["Single", "Double", "Suite"]).withMessage("Invalid room type"),
  body("checkIn").isISO8601().withMessage("checkIn must be date"),
  body("checkOut").isISO8601().withMessage("checkOut must be date"),
  body("guests").isInt({ min: 1, max: 10 }).withMessage("Guests must be 1-10"),
  body("paymentMethod").optional().isIn(["stripe", "razorpay-sim", "razorpay"]).withMessage("Invalid payment method"),
];
