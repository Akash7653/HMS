const express = require("express");
const {
	getHotels,
	getHotelById,
	getSearchSuggestions,
	getSimilarHotels,
	getRecommendedHotels,
} = require("../controllers/hotelController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/", getHotels);
router.get("/suggestions", getSearchSuggestions);
router.get("/similar/:id", getSimilarHotels);
router.get("/recommended/for-me", protect, getRecommendedHotels);
router.get("/:id", getHotelById);

module.exports = router;
