const express = require("express");
const { protect } = require("../middleware/auth");
const { chat, chatbot, getPricingInsights, getMarketTrends } = require("../controllers/aiController");

const router = express.Router();

router.use(protect); // All AI routes require authentication

router.post("/chat", chat);
router.post("/chatbot", chatbot);
router.get("/pricing-insights", getPricingInsights);
router.get("/market-trends", getMarketTrends);

module.exports = router;
