const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getHeatmapData,
  searchByPolygon,
  getPriceOverlays,
  getPopularAreas,
  getMapSearchSuggestions,
  searchThisArea
} = require("../controllers/mapController");
const { cache } = require("../middleware/cacheMiddleware");

const router = express.Router();

// Public map endpoints
router.get("/heatmap", cache(600), getHeatmapData);
router.get("/price-overlays", cache(900), getPriceOverlays);
router.get("/popular-areas", cache(1800), getPopularAreas);
router.get("/search-suggestions", cache(300), getMapSearchSuggestions);

// Protected map endpoints
router.use(protect);
router.post("/search-polygon", searchByPolygon);
router.post("/search-this-area", searchThisArea);

module.exports = router;
