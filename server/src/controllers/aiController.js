const { getAiResponse } = require("../services/aiService");
const AIChatbot = require("../services/aiChatbot");
const PredictivePricing = require("../services/predictivePricing");

exports.chat = async (req, res, next) => {
  try {
    const { message, history, context } = req.body || {};
    if (!message || !String(message).trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    const result = await getAiResponse({
      message,
      history: Array.isArray(history) ? history : [],
      userContext: context || {},
    });

    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

exports.chatbot = async (req, res, next) => {
  try {
    const { message } = req.body;
    const userId = req.user?.id;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required"
      });
    }

    const response = await AIChatbot.processMessage(userId, message);

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process chat message'
    });
  }
};

exports.getPricingInsights = async (req, res, next) => {
  try {
    const { hotelId, checkInDate } = req.query;

    if (!hotelId || !checkInDate) {
      return res.status(400).json({
        success: false,
        message: "Hotel ID and check-in date are required"
      });
    }

    const insights = await PredictivePricing.analyzePricingTrends(hotelId, new Date(checkInDate));

    if (!insights) {
      return res.status(404).json({
        success: false,
        message: "Unable to generate pricing insights"
      });
    }

    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    console.error('Pricing insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate pricing insights'
    });
  }
};

exports.getMarketTrends = async (req, res, next) => {
  try {
    const { city } = req.query;

    if (!city) {
      return res.status(400).json({
        success: false,
        message: "City is required"
      });
    }

    const trends = await PredictivePricing.getMarketTrends(city);

    if (!trends) {
      return res.status(404).json({
        success: false,
        message: "Unable to generate market trends"
      });
    }

    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error('Market trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate market trends'
    });
  }
};
