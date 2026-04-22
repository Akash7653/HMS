const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  trackPageView,
  trackEvent,
  trackConversion,
  getAnalyticsDashboard,
  getUserBehaviorAnalytics,
  getRealTimeMetrics,
  getAdminAnalytics,
  getRevenueAnalytics,
  getUserAnalytics
} = require("../controllers/analyticsController");

const router = express.Router();

// Public tracking endpoints (no auth required for basic tracking)
router.post("/track/pageview", trackPageView);
router.post("/track/event", trackEvent);
router.post("/track/conversion", trackConversion);

// Protected analytics endpoints
router.use(protect);

// User analytics
router.get("/dashboard", getAnalyticsDashboard);
router.get("/user-behavior", getUserBehaviorAnalytics);
router.get("/real-time", getRealTimeMetrics);

// Admin-only analytics
router.get("/admin/dashboard", getAdminAnalytics);
router.get("/admin/revenue", getRevenueAnalytics);
router.get("/admin/users", getUserAnalytics);

module.exports = router;
