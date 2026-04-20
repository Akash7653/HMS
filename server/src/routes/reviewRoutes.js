const express = require("express");
const { addReview, getHotelReviews } = require("../controllers/reviewController");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { reviewValidator } = require("../validators/reviewValidators");

const router = express.Router();

router.get("/hotel/:hotelId", getHotelReviews);
router.post("/", protect, reviewValidator, validate, addReview);

module.exports = router;
