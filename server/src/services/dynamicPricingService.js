const Hotel = require("../models/Hotel");
const Booking = require("../models/Booking");
const dayjs = require("dayjs");

class DynamicPricingService {
  static async calculateDynamicPrice(hotelId, roomType, checkInDate, checkOutDate, basePrice) {
    try {
      const checkIn = dayjs(checkInDate);
      const checkOut = dayjs(checkOutDate);
      const today = dayjs();
      
      // Get booking data for demand analysis
      const demandData = await this.getDemandData(hotelId, checkIn, checkOut);
      
      // Calculate multipliers
      const seasonalMultiplier = this.getSeasonalMultiplier(checkIn);
      const demandMultiplier = this.getDemandMultiplier(demandData);
      const dayOfWeekMultiplier = this.getDayOfWeekMultiplier(checkIn);
      const leadTimeMultiplier = this.getLeadTimeMultiplier(checkIn, today);
      const occupancyMultiplier = await this.getOccupancyMultiplier(hotelId, roomType, checkIn, checkOut);
      const competitorMultiplier = await this.getCompetitorMultiplier(hotelId, checkIn);
      
      // Calculate final price
      let finalPrice = basePrice;
      finalPrice *= seasonalMultiplier;
      finalPrice *= demandMultiplier;
      finalPrice *= dayOfWeekMultiplier;
      finalPrice *= leadTimeMultiplier;
      finalPrice *= occupancyMultiplier;
      finalPrice *= competitorMultiplier;
      
      // Apply maximum and minimum limits
      const maxPrice = basePrice * 3; // Maximum 3x base price
      const minPrice = basePrice * 0.5; // Minimum 50% of base price
      
      finalPrice = Math.max(minPrice, Math.min(maxPrice, finalPrice));
      
      return {
        originalPrice: basePrice,
        finalPrice: Math.round(finalPrice),
        priceChange: Math.round(((finalPrice - basePrice) / basePrice) * 100),
        multipliers: {
          seasonal: seasonalMultiplier,
          demand: demandMultiplier,
          dayOfWeek: dayOfWeekMultiplier,
          leadTime: leadTimeMultiplier,
          occupancy: occupancyMultiplier,
          competitor: competitorMultiplier
        },
        reasoning: this.generatePricingReasoning({
          seasonalMultiplier,
          demandMultiplier,
          dayOfWeekMultiplier,
          leadTimeMultiplier,
          occupancyMultiplier,
          competitorMultiplier,
          checkIn,
          demandData
        })
      };
    } catch (error) {
      console.error('Error calculating dynamic price:', error);
      return {
        originalPrice: basePrice,
        finalPrice: basePrice,
        priceChange: 0,
        multipliers: {},
        reasoning: ['Standard pricing applied due to calculation error']
      };
    }
  }

  static async getDemandData(hotelId, checkIn, checkOut) {
    const startDate = checkIn.subtract(30, 'day').toDate();
    const endDate = checkIn.add(30, 'day').toDate();
    
    const bookings = await Booking.find({
      hotel: hotelId,
      checkIn: { $gte: startDate, $lte: endDate },
      bookingStatus: 'confirmed'
    });
    
    const totalBookings = bookings.length;
    const recentBookings = bookings.filter(b => 
      dayjs(b.createdAt).isAfter(dayjs().subtract(7, 'day'))
    ).length;
    
    const sameDateBookings = bookings.filter(b => 
      dayjs(b.checkIn).isSame(checkIn, 'day')
    ).length;
    
    return {
      totalBookings,
      recentBookings,
      sameDateBookings,
      averageStayLength: bookings.reduce((sum, b) => sum + b.nights, 0) / totalBookings || 1
    };
  }

  static getSeasonalMultiplier(date) {
    const month = date.month();
    
    // Peak season rates
    if ([11, 12, 0, 1].includes(month)) { // Nov-Feb
      return 1.4;
    }
    // Holiday season
    else if ([3, 4].includes(month)) { // Apr-May
      return 1.3;
    }
    // Shoulder season
    else if ([2, 9, 10].includes(month)) { // Mar, Sep, Oct
      return 1.1;
    }
    // Off season
    else { // Jun-Aug
      return 0.9;
    }
  }

  static getDemandMultiplier(demandData) {
    const { totalBookings, recentBookings, sameDateBookings } = demandData;
    
    // High demand indicators
    if (recentBookings >= 10 || sameDateBookings >= 5) {
      return 1.3;
    }
    // Medium demand
    else if (recentBookings >= 5 || sameDateBookings >= 2) {
      return 1.15;
    }
    // Low demand
    else if (totalBookings < 5) {
      return 0.9;
    }
    // Normal demand
    else {
      return 1.0;
    }
  }

  static getDayOfWeekMultiplier(date) {
    const dayOfWeek = date.day();
    
    // Weekend premium
    if ([5, 6].includes(dayOfWeek)) { // Fri, Sat
      return 1.25;
    }
    // Sunday
    else if (dayOfWeek === 0) {
      return 1.1;
    }
    // Thursday
    else if (dayOfWeek === 4) {
      return 1.05;
    }
    // Weekdays
    else {
      return 1.0;
    }
  }

  static getLeadTimeMultiplier(checkIn, today) {
    const daysUntilCheckIn = checkIn.diff(today, 'day');
    
    // Last minute premium
    if (daysUntilCheckIn <= 3) {
      return 1.4;
    }
    // Short notice
    else if (daysUntilCheckIn <= 7) {
      return 1.2;
    }
    // Medium advance
    else if (daysUntilCheckIn <= 21) {
      return 1.05;
    }
    // Long advance (discount)
    else if (daysUntilCheckIn >= 60) {
      return 0.95;
    }
    // Normal
    else {
      return 1.0;
    }
  }

  static async getOccupancyMultiplier(hotelId, roomType, checkIn, checkOut) {
    try {
      // Get current occupancy for the date range
      const existingBookings = await Booking.find({
        hotel: hotelId,
        roomType,
        $or: [
          { checkIn: { $lte: checkIn }, checkOut: { $gt: checkIn } },
          { checkIn: { $lt: checkOut }, checkOut: { $gte: checkOut } },
          { checkIn: { $gte: checkIn }, checkOut: { $lte: checkOut } }
        ],
        bookingStatus: 'confirmed'
      });

      const hotel = await Hotel.findById(hotelId);
      const roomTypeInfo = hotel.roomTypes.find(rt => rt.type === roomType);
      const totalRooms = roomTypeInfo?.totalRooms || 1;
      
      const occupiedRooms = existingBookings.length;
      const occupancyRate = occupiedRooms / totalRooms;
      
      // High occupancy premium
      if (occupancyRate >= 0.9) {
        return 1.35;
      }
      // Medium-high occupancy
      else if (occupancyRate >= 0.75) {
        return 1.2;
      }
      // Medium occupancy
      else if (occupancyRate >= 0.5) {
        return 1.1;
      }
      // Low occupancy discount
      else if (occupancyRate <= 0.25) {
        return 0.85;
      }
      // Normal
      else {
        return 1.0;
      }
    } catch (error) {
      console.error('Error calculating occupancy multiplier:', error);
      return 1.0;
    }
  }

  static async getCompetitorMultiplier(hotelId, checkIn) {
    try {
      const hotel = await Hotel.findById(hotelId);
      const similarHotels = await Hotel.find({
        _id: { $ne: hotelId },
        "location.city": hotel.location.city,
        isActive: true
      }).limit(10);

      if (similarHotels.length === 0) return 1.0;

      // Calculate average competitor pricing
      const competitorPrices = await Promise.all(
        similarHotels.map(async (competitor) => {
          const basePrice = competitor.roomTypes[0]?.basePrice || 0;
          const dynamicResult = await this.calculateDynamicPrice(
            competitor._id,
            competitor.roomTypes[0]?.type || "Single",
            checkIn.toDate(),
            checkIn.add(1, 'day').toDate(),
            basePrice
          );
          return dynamicResult.finalPrice;
        })
      );

      const avgCompetitorPrice = competitorPrices.reduce((sum, price) => sum + price, 0) / competitorPrices.length;
      const hotelBasePrice = hotel.roomTypes[0]?.basePrice || 0;

      // Adjust based on competitor pricing
      if (hotelBasePrice > avgCompetitorPrice * 1.2) {
        return 0.9; // Slightly overpriced, reduce
      } else if (hotelBasePrice < avgCompetitorPrice * 0.8) {
        return 1.1; // Underpriced, can increase
      } else {
        return 1.0; // Competitively priced
      }
    } catch (error) {
      console.error('Error calculating competitor multiplier:', error);
      return 1.0;
    }
  }

  static generatePricingReasoning(multipliers) {
    const reasoning = [];
    const {
      seasonalMultiplier,
      demandMultiplier,
      dayOfWeekMultiplier,
      leadTimeMultiplier,
      occupancyMultiplier,
      competitorMultiplier,
      checkIn,
      demandData
    } = multipliers;

    if (seasonalMultiplier > 1.2) {
      reasoning.push("Peak season pricing applied");
    } else if (seasonalMultiplier < 1.0) {
      reasoning.push("Off-season discount applied");
    }

    if (demandMultiplier > 1.2) {
      reasoning.push("High demand - prices increased");
    } else if (demandMultiplier < 1.0) {
      reasoning.push("Low demand - prices decreased");
    }

    if (dayOfWeekMultiplier > 1.2) {
      reasoning.push("Weekend premium applied");
    }

    if (leadTimeMultiplier > 1.3) {
      reasoning.push("Last-minute booking premium");
    } else if (leadTimeMultiplier < 1.0) {
      reasoning.push("Advance booking discount");
    }

    if (occupancyMultiplier > 1.3) {
      reasoning.push("High occupancy - prices increased");
    } else if (occupancyMultiplier < 1.0) {
      reasoning.push("Low occupancy - prices decreased");
    }

    if (competitorMultiplier > 1.0) {
      reasoning.push("Competitive pricing adjustment");
    }

    return reasoning;
  }

  static async getBulkPricing(hotelId, roomType, dateRanges, basePrice) {
    const results = await Promise.all(
      dateRanges.map(async ({ checkIn, checkOut }) => {
        return await this.calculateDynamicPrice(hotelId, roomType, checkIn, checkOut, basePrice);
      })
    );

    return results;
  }

  static async getPricingTrends(hotelId, roomType, days = 30) {
    const startDate = dayjs();
    const endDate = startDate.add(days, 'day');
    
    const dateRanges = [];
    for (let date = startDate; date.isBefore(endDate); date = date.add(1, 'day')) {
      dateRanges.push({
        checkIn: date.toDate(),
        checkOut: date.add(1, 'day').toDate()
      });
    }

    const hotel = await Hotel.findById(hotelId);
    const basePrice = hotel.roomTypes.find(rt => rt.type === roomType)?.basePrice || 0;

    const pricingData = await this.getBulkPricing(hotelId, roomType, dateRanges, basePrice);

    return {
      hotelId,
      roomType,
      basePrice,
      trends: pricingData.map((data, index) => ({
        date: dateRanges[index].checkIn,
        price: data.finalPrice,
        priceChange: data.priceChange,
        reasoning: data.reasoning
      })),
      summary: {
        averagePrice: Math.round(pricingData.reduce((sum, d) => sum + d.finalPrice, 0) / pricingData.length),
        maxPrice: Math.max(...pricingData.map(d => d.finalPrice)),
        minPrice: Math.min(...pricingData.map(d => d.finalPrice)),
        priceVolatility: this.calculateVolatility(pricingData.map(d => d.finalPrice))
      }
    };
  }

  static calculateVolatility(prices) {
    const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
    return Math.sqrt(variance) / mean;
  }
}

module.exports = DynamicPricingService;
