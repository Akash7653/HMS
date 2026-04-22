const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  getRecommendations,
  trackBehavior,
  getSimilarHotels,
  getPopularInArea
} = require("../controllers/recommendationController");

router.use(protect); // All recommendation routes require authentication

router.get("/", getRecommendations);
router.post("/track", trackBehavior);
router.get("/similar/:hotelId", getSimilarHotels);
router.get("/popular", getPopularInArea);

module.exports = router;
