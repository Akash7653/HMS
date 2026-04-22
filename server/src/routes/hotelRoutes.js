const express = require("express");
const {
	getHotels,
	getHotelById,
	getSearchSuggestions,
	getSimilarHotels,
	getRecommendedHotels,
} = require("../controllers/hotelController");
const { protect } = require("../middleware/auth");
const { 
  cache,
  cacheSearchResults, 
  cacheHotelDetails, 
  cacheRecommendations 
} = require("../middleware/cacheMiddleware");

const router = express.Router();

router.get("/", cacheSearchResults(300), getHotels);
router.get("/suggestions", cache(600), getSearchSuggestions);
router.get("/similar/:id", cache(900), getSimilarHotels);
router.get("/recommended/for-me", protect, cacheRecommendations(3600), getRecommendedHotels);
router.get("/:id", cacheHotelDetails(1800), getHotelById);

module.exports = router;
