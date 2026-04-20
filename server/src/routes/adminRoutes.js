const express = require("express");
const {
  createHotel,
  updateHotel,
  deleteHotel,
  updateInventory,
  getAllBookings,
  getAnalytics,
} = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { hotelValidator } = require("../validators/hotelValidators");

const router = express.Router();

router.use(protect, authorize("admin"));

router.post("/hotels", hotelValidator, validate, createHotel);
router.put("/hotels/:id", updateHotel);
router.delete("/hotels/:id", deleteHotel);
router.patch("/hotels/:id/inventory", updateInventory);
router.get("/bookings", getAllBookings);
router.get("/analytics", getAnalytics);

module.exports = router;
