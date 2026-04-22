const Hotel = require("../models/Hotel");
const Booking = require("../models/Booking");
const dayjs = require("dayjs");

class PredictivePricing {
  static async analyzePricingTrends(hotelId, checkInDate) {
    try {
      const hotel = await Hotel.findById(hotelId);
      if (!hotel) return null;

      const checkIn = dayjs(checkInDate);
      const today = dayjs();
      
      // Get historical booking data for similar dates
      const historicalData = await this.getHistoricalData(hotelId, checkIn);
      
      // Calculate demand indicators
      const demandScore = this.calculateDemandScore(hotelId, checkIn, historicalData);
      
      // Seasonal pricing adjustment
      const seasonalMultiplier = this.getSeasonalMultiplier(checkIn);
      
      // Weekend/holiday pricing
      const weekendMultiplier = this.getWeekendMultiplier(checkIn);
      
      // Last-minute booking urgency
      const urgencyMultiplier = this.getUrgencyMultiplier(checkIn, today);
      
      // Competitor pricing (simplified)
      const competitorMultiplier = await this.getCompetitorMultiplier(hotel, checkIn);
      
      // Calculate predicted price
      const basePrice = hotel.roomTypes[0]?.basePrice || 100;
      const predictedPrice = Math.round(
        basePrice * 
        seasonalMultiplier * 
        weekendMultiplier * 
        urgencyMultiplier * 
        competitorMultiplier
      );
      
      // Generate insights
      const insights = this.generateInsights(
        demandScore,
        seasonalMultiplier,
        weekendMultiplier,
        urgencyMultiplier,
        checkIn,
        today
      );
      
      return {
        currentPrice: basePrice,
        predictedPrice,
        priceTrend: predictedPrice > basePrice ? 'increasing' : predictedPrice < basePrice ? 'decreasing' : 'stable',
        priceChange: Math.round(((predictedPrice - basePrice) / basePrice) * 100),
        confidence: this.calculateConfidence(historicalData),
        insights,
        recommendations: this.generateRecommendations(insights, checkIn, today)
      };
    } catch (error) {
      console.error('Error analyzing pricing trends:', error);
      return null;
    }
  }

  static async getHistoricalData(hotelId, targetDate) {
    const targetMonth = targetDate.month();
    const targetDayOfWeek = targetDate.day();
    
    // Get bookings from the same month in previous years
    const startDate = targetDate.subtract(2, 'year').startOf('month');
    const endDate = targetDate.add(1, 'month').endOf('month');
    
    const bookings = await Booking.aggregate([
      {
        $match: {
          hotel: new mongoose.Types.ObjectId(hotelId),
          checkIn: { $gte: startDate.toDate(), $lte: endDate.toDate() },
          bookingStatus: 'confirmed'
        }
      },
      {
        $addFields: {
          month: { $month: "$checkIn" },
          dayOfWeek: { $dayOfWeek: "$checkIn" },
          daysUntilCheckIn: {
            $divide: [
              { $subtract: ["$checkIn", "$createdAt"] },
              1000 * 60 * 60 * 24 // Convert to days
            ]
          }
        }
      },
      {
        $match: {
          $or: [
            { month: targetMonth },
            { dayOfWeek: targetDayOfWeek }
          ]
        }
      }
    ]);
    
    return bookings;
  }

  static calculateDemandScore(hotelId, checkInDate, historicalData) {
    if (historicalData.length === 0) return 0.5;
    
    // Calculate average booking lead time
    const avgLeadTime = historicalData.reduce((sum, booking) => sum + booking.daysUntilCheckIn, 0) / historicalData.length;
    
    // Calculate demand based on how far in advance people book
    const daysUntilCheckIn = checkInDate.diff(dayjs(), 'day');
    
    if (daysUntilCheckIn < avgLeadTime * 0.5) {
      return 0.8; // High demand - booking last minute
    } else if (daysUntilCheckIn < avgLeadTime) {
      return 0.6; // Medium demand
    } else {
      return 0.4; // Low demand - booking far in advance
    }
  }

  static getSeasonalMultiplier(date) {
    const month = date.month();
    
    // Peak season (Nov-Feb, Apr-May)
    if ([10, 11, 0, 1, 3, 4].includes(month)) {
      return 1.3;
    }
    // Shoulder season (Mar, Jun, Sep, Oct)
    else if ([2, 5, 8, 9].includes(month)) {
      return 1.1;
    }
    // Off season (Jul-Aug)
    else {
      return 0.9;
    }
  }

  static getWeekendMultiplier(date) {
    const dayOfWeek = date.day();
    
    // Friday, Saturday, Sunday have higher rates
    if ([5, 6, 0].includes(dayOfWeek)) {
      return 1.25;
    }
    // Thursday is slightly higher
    else if (dayOfWeek === 4) {
      return 1.1;
    }
    // Weekday rates
    else {
      return 1.0;
    }
  }

  static getUrgencyMultiplier(checkInDate, today) {
    const daysUntilCheckIn = checkInDate.diff(today, 'day');
    
    // Last minute pricing
    if (daysUntilCheckIn <= 3) {
      return 1.4;
    } else if (daysUntilCheckIn <= 7) {
      return 1.2;
    } else if (daysUntilCheckIn <= 14) {
      return 1.1;
    } else if (daysUntilCheckIn <= 30) {
      return 1.05;
    } else {
      return 1.0;
    }
  }

  static async getCompetitorMultiplier(hotel, checkInDate) {
    // Simplified competitor analysis based on hotel rating and location
    const similarHotels = await Hotel.find({
      'location.city': hotel.location.city,
      ratingAverage: { $gte: hotel.ratingAverage - 0.5, $lte: hotel.ratingAverage + 0.5 },
      _id: { $ne: hotel._id },
      isActive: true
    }).limit(5);
    
    if (similarHotels.length === 0) return 1.0;
    
    const avgCompetitorPrice = similarHotels.reduce((sum, h) => {
      return sum + (h.roomTypes[0]?.basePrice || 0);
    }, 0) / similarHotels.length;
    
    const hotelPrice = hotel.roomTypes[0]?.basePrice || 100;
    
    // Adjust based on competitor pricing
    if (hotelPrice > avgCompetitorPrice * 1.2) {
      return 0.95; // Slightly overpriced, reduce
    } else if (hotelPrice < avgCompetitorPrice * 0.8) {
      return 1.05; // Underpriced, can increase
    } else {
      return 1.0; // Competitively priced
    }
  }

  static generateInsights(demandScore, seasonalMultiplier, weekendMultiplier, urgencyMultiplier, checkIn, today) {
    const insights = [];
    
    if (demandScore > 0.7) {
      insights.push("High demand expected - prices may increase");
    } else if (demandScore < 0.4) {
      insights.push("Low demand expected - good time to book");
    }
    
    if (seasonalMultiplier > 1.2) {
      insights.push("Peak season pricing applies");
    } else if (seasonalMultiplier < 1.0) {
      insights.push("Off-season discounts available");
    }
    
    if (weekendMultiplier > 1.2) {
      insights.push("Weekend rates are higher");
    }
    
    const daysUntil = checkIn.diff(today, 'day');
    if (daysUntil <= 7) {
      insights.push("Last-minute booking - limited availability");
    } else if (daysUntil > 30) {
      insights.push("Book in advance for better rates");
    }
    
    return insights;
  }

  static generateRecommendations(insights, checkIn, today) {
    const recommendations = [];
    const daysUntil = checkIn.diff(today, 'day');
    
    if (daysUntil <= 7) {
      recommendations.push("Book now to avoid price increases");
    } else if (daysUntil > 30 && daysUntil <= 60) {
      recommendations.push("Best time to book for optimal pricing");
    } else if (daysUntil > 60) {
      recommendations.push("Wait for closer dates or monitor prices");
    }
    
    if (insights.some(i => i.includes("High demand"))) {
      recommendations.push("Consider booking soon - prices likely to increase");
    }
    
    if (insights.some(i => i.includes("Low demand"))) {
      recommendations.push("Good opportunity for discounts");
    }
    
    return recommendations;
  }

  static calculateConfidence(historicalData) {
    if (historicalData.length === 0) return 0.3;
    if (historicalData.length < 5) return 0.5;
    if (historicalData.length < 15) return 0.7;
    return 0.9;
  }

  static async getMarketTrends(city) {
    try {
      const hotels = await Hotel.find({ 'location.city': city, isActive: true });
      
      const trends = await Promise.all(
        hotels.map(async (hotel) => {
          const nextMonth = dayjs().add(1, 'month');
          const analysis = await this.analyzePricingTrends(hotel._id, nextMonth.toDate());
          return analysis;
        })
      );
      
      const validTrends = trends.filter(t => t !== null);
      
      if (validTrends.length === 0) {
        return {
          averageTrend: 'stable',
          priceChange: 0,
          insights: ["Insufficient data for market analysis"]
        };
      }
      
      const avgPriceChange = validTrends.reduce((sum, t) => sum + t.priceChange, 0) / validTrends.length;
      const increasingCount = validTrends.filter(t => t.priceTrend === 'increasing').length;
      const decreasingCount = validTrends.filter(t => t.priceTrend === 'decreasing').length;
      
      let marketTrend = 'stable';
      if (increasingCount > decreasingCount * 1.5) marketTrend = 'increasing';
      else if (decreasingCount > increasingCount * 1.5) marketTrend = 'decreasing';
      
      return {
        marketTrend,
        averagePriceChange: Math.round(avgPriceChange),
        insights: [
          `${increasingCount} hotels showing price increases`,
          `${decreasingCount} hotels showing price decreases`,
          `Average market price change: ${Math.round(avgPriceChange)}%`
        ]
      };
    } catch (error) {
      console.error('Error getting market trends:', error);
      return null;
    }
  }
}

module.exports = PredictivePricing;
