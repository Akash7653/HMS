const RecommendationEngine = require("../services/recommendationEngine");
const Recommendation = require("../models/Recommendation");
const Hotel = require("../models/Hotel");

exports.getRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10 } = req.query;

    // Try to get cached recommendations first
    let recommendations = await Recommendation.find({ user: userId })
      .populate('hotel')
      .sort({ score: -1 })
      .limit(parseInt(limit));

    // If no recommendations or they're old, generate new ones
    if (recommendations.length === 0) {
      await RecommendationEngine.generateRecommendations(userId, limit);
      recommendations = await Recommendation.find({ user: userId })
        .populate('hotel')
        .sort({ score: -1 })
        .limit(parseInt(limit));
    }

    res.json({
      success: true,
      data: recommendations.map(r => ({
        hotel: r.hotel,
        score: r.score,
        reason: r.reason,
        context: r.context
      }))
    });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recommendations'
    });
  }
};

exports.trackBehavior = async (req, res) => {
  try {
    const userId = req.user.id;
    const behaviorData = {
      ...req.body,
      sessionId: req.sessionId || 'unknown',
      userAgent: req.get('User-Agent'),
      device: req.get('User-Agent')?.includes('Mobile') ? 'mobile' : 'desktop'
    };

    await RecommendationEngine.trackUserBehavior(userId, behaviorData);

    res.json({
      success: true,
      message: 'Behavior tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking behavior:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track behavior'
    });
  }
};

exports.getSimilarHotels = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const userId = req.user?.id;

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }

    const similar = await RecommendationEngine.findSimilarHotels(
      hotel, 
      userId, 
      'similar_to_viewed'
    );

    const hotelIds = similar.map(s => s.hotel);
    const hotels = await Hotel.find({ _id: { $in: hotelIds } });

    const result = similar.map(s => {
      const hotelData = hotels.find(h => h._id.equals(s.hotel));
      return {
        ...s,
        hotel: hotelData
      };
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error getting similar hotels:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get similar hotels'
    });
  }
};

exports.getPopularInArea = async (req, res) => {
  try {
    const { city } = req.query;
    const userId = req.user?.id;

    if (!city) {
      return res.status(400).json({
        success: false,
        message: 'City is required'
      });
    }

    const popular = await RecommendationEngine.findPopularInArea(city, userId);
    const hotelIds = popular.map(p => p.hotel);
    const hotels = await Hotel.find({ _id: { $in: hotelIds } });

    const result = popular.map(p => {
      const hotelData = hotels.find(h => h._id.equals(p.hotel));
      return {
        ...p,
        hotel: hotelData
      };
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error getting popular hotels:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get popular hotels'
    });
  }
};
