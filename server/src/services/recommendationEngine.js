const Hotel = require("../models/Hotel");
const UserBehavior = require("../models/UserBehavior");
const Recommendation = require("../models/Recommendation");
const Booking = require("../models/Booking");

class RecommendationEngine {
  static async generateRecommendations(userId, limit = 10) {
    try {
      // Get user's recent behavior
      const recentBehavior = await UserBehavior.find({ user: userId })
        .sort({ timestamp: -1 })
        .limit(50)
        .populate('hotel');

      // Get user's booking history
      const bookingHistory = await Booking.find({ user: userId, bookingStatus: 'confirmed' })
        .populate('hotel')
        .sort({ createdAt: -1 });

      // Generate recommendations based on different strategies
      const recommendations = [];

      // 1. Similar to viewed hotels
      const viewedHotels = recentBehavior
        .filter(b => b.type === 'view' && b.hotel)
        .map(b => b.hotel);

      for (const viewedHotel of viewedHotels.slice(0, 5)) {
        const similar = await this.findSimilarHotels(viewedHotel, userId, 'similar_to_viewed');
        recommendations.push(...similar);
      }

      // 2. Similar to booked hotels
      const bookedHotels = bookingHistory.map(b => b.hotel);
      for (const bookedHotel of bookedHotels.slice(0, 3)) {
        const similar = await this.findSimilarHotels(bookedHotel, userId, 'similar_to_booked', 0.8);
        recommendations.push(...similar);
      }

      // 3. Popular in searched areas
      const searchBehavior = recentBehavior.filter(b => b.type === 'search' && b.searchData?.city);
      if (searchBehavior.length > 0) {
        const popularInArea = await this.findPopularInArea(searchBehavior[0].searchData.city, userId);
        recommendations.push(...popularInArea);
      }

      // 4. Trending hotels
      const trending = await this.findTrendingHotels(userId);
      recommendations.push(...trending);

      // Remove duplicates and sort by score
      const uniqueRecommendations = this.deduplicateAndSort(recommendations, limit);

      // Save to database
      await this.saveRecommendations(userId, uniqueRecommendations);

      return uniqueRecommendations;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [];
    }
  }

  static async findSimilarHotels(hotel, userId, reason, baseScore = 0.7) {
    try {
      const similarHotels = await Hotel.find({
        _id: { $ne: hotel._id },
        "location.city": hotel.location.city,
        isActive: true
      })
      .limit(20);

      const recommendations = [];

      for (const similar of similarHotels) {
        let score = baseScore;

        // Price similarity
        const priceDiff = Math.abs(
          similar.roomTypes[0]?.basePrice - hotel.roomTypes[0]?.basePrice
        ) / hotel.roomTypes[0]?.basePrice;
        score -= priceDiff * 0.2;

        // Rating similarity
        const ratingDiff = Math.abs(similar.ratingAverage - hotel.ratingAverage);
        score -= ratingDiff * 0.1;

        // Amenity similarity
        const commonAmenities = similar.amenities.filter(a => hotel.amenities.includes(a));
        const amenityScore = commonAmenities.length / Math.max(hotel.amenities.length, 1);
        score += amenityScore * 0.2;

        recommendations.push({
          hotel: similar._id,
          score: Math.max(0, Math.min(1, score)),
          reason,
          context: {
            similarHotelId: hotel._id,
            behaviorScore: score
          }
        });
      }

      return recommendations.sort((a, b) => b.score - a.score).slice(0, 5);
    } catch (error) {
      console.error('Error finding similar hotels:', error);
      return [];
    }
  }

  static async findPopularInArea(city, userId) {
    try {
      const popularHotels = await Hotel.aggregate([
        { $match: { "location.city": city, isActive: true } },
        {
          $addFields: {
            popularityScore: {
              $add: [
                { $multiply: ["$ratingAverage", 0.4] },
                { $multiply: [{ $divide: ["$ratingCount", 100] }, 0.3] },
                { $multiply: [{ $divide: [{ $size: "$amenities" }, 10] }, 0.3] }
              ]
            }
          }
        },
        { $sort: { popularityScore: -1 } },
        { $limit: 10 }
      ]);

      return popularHotels.map(hotel => ({
        hotel: hotel._id,
        score: Math.min(1, hotel.popularityScore / 5),
        reason: 'popular_in_area',
        context: {
          popularityScore: hotel.popularityScore,
          searchQuery: city
        }
      }));
    } catch (error) {
      console.error('Error finding popular hotels in area:', error);
      return [];
    }
  }

  static async findTrendingHotels(userId) {
    try {
      // Find hotels with recent booking activity
      const recentBookings = await Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            bookingStatus: 'confirmed'
          }
        },
        {
          $group: {
            _id: '$hotel',
            bookingCount: { $sum: 1 },
            avgRating: { $avg: '$totalPrice' }
          }
        },
        { $sort: { bookingCount: -1 } },
        { $limit: 10 }
      ]);

      const trendingHotelIds = recentBookings.map(b => b._id);
      const trendingHotels = await Hotel.find({ _id: { $in: trendingHotelIds }, isActive: true });

      return trendingHotels.map(hotel => {
        const bookingData = recentBookings.find(b => b._id.equals(hotel._id));
        return {
          hotel: hotel._id,
          score: Math.min(1, bookingData.bookingCount / 10),
          reason: 'trending',
          context: {
            popularityScore: bookingData.bookingCount
          }
        };
      });
    } catch (error) {
      console.error('Error finding trending hotels:', error);
      return [];
    }
  }

  static deduplicateAndSort(recommendations, limit) {
    const unique = new Map();

    for (const rec of recommendations) {
      const key = rec.hotel.toString();
      if (!unique.has(key) || unique.get(key).score < rec.score) {
        unique.set(key, rec);
      }
    }

    return Array.from(unique.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  static async saveRecommendations(userId, recommendations) {
    try {
      // Clear old recommendations
      await Recommendation.deleteMany({ user: userId });

      // Save new ones
      const docs = recommendations.map(rec => ({
        ...rec,
        user: userId
      }));

      await Recommendation.insertMany(docs);
    } catch (error) {
      console.error('Error saving recommendations:', error);
    }
  }

  static async trackUserBehavior(userId, behaviorData) {
    try {
      const behavior = new UserBehavior({
        user: userId,
        ...behaviorData
      });
      await behavior.save();

      // Trigger recommendation refresh for significant actions
      if (['booking', 'wishlist'].includes(behaviorData.type)) {
        // Async recommendation generation
        setTimeout(() => this.generateRecommendations(userId), 1000);
      }
    } catch (error) {
      console.error('Error tracking user behavior:', error);
    }
  }
}

module.exports = RecommendationEngine;
