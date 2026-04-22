const express = require("express");
const {
  createBooking,
  getMyBookings,
  cancelBooking,
  checkAvailability,
  streamAvailability,
} = require("../controllers/bookingController");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { createBookingValidator } = require("../validators/bookingValidators");
const { cacheAvailability } = require("../middleware/cacheMiddleware");

const router = express.Router();

router.get("/availability", cacheAvailability(60), checkAvailability);
router.get("/availability/stream", streamAvailability);

router.post("/", protect, createBookingValidator, validate, createBooking);
router.get("/me", protect, getMyBookings);
router.patch("/:id/cancel", protect, cancelBooking);

module.exports = router;
