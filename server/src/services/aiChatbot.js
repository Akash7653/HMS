const Hotel = require("../models/Hotel");
const Booking = require("../models/Booking");

class AIChatbot {
  static async processMessage(userId, message) {
    try {
      const lowerMessage = message.toLowerCase();
      
      // Intent detection
      if (this.containsKeywords(lowerMessage, ['find', 'search', 'looking for', 'need', 'want'])) {
        return await this.handleSearchIntent(message);
      }
      
      if (this.containsKeywords(lowerMessage, ['price', 'cost', 'rate', 'cheapest', 'budget'])) {
        return await this.handlePricingIntent(message);
      }
      
      if (this.containsKeywords(lowerMessage, ['recommend', 'suggest', 'best', 'good'])) {
        return await this.handleRecommendationIntent(message);
      }
      
      if (this.containsKeywords(lowerMessage, ['booking', 'reserve', 'book', 'cancel'])) {
        return await this.handleBookingIntent(message);
      }
      
      if (this.containsKeywords(lowerMessage, ['amenities', 'facilities', 'services', 'features'])) {
        return await this.handleAmenitiesIntent(message);
      }
      
      return this.generateGeneralResponse(message);
    } catch (error) {
      console.error('Error processing chatbot message:', error);
      return {
        type: 'error',
        message: 'I apologize, but I encountered an error. Please try again.'
      };
    }
  }

  static containsKeywords(text, keywords) {
    return keywords.some(keyword => text.includes(keyword));
  }

  static async handleSearchIntent(message) {
    const city = this.extractCity(message);
    const priceRange = this.extractPriceRange(message);
    const guests = this.extractGuests(message);
    
    let query = { isActive: true };
    
    if (city) {
      query['location.city'] = { $regex: city, $options: 'i' };
    }
    
    if (priceRange) {
      query['roomTypes.basePrice'] = { 
        $gte: priceRange.min, 
        $lte: priceRange.max 
      };
    }
    
    const hotels = await Hotel.find(query).limit(5);
    
    if (hotels.length === 0) {
      return {
        type: 'search_results',
        message: `I couldn't find hotels matching your criteria. Try adjusting your search terms or budget.`,
        hotels: []
      };
    }
    
    return {
      type: 'search_results',
      message: `I found ${hotels.length} great hotels for you! Here are the top options:`,
      hotels: hotels.map(h => ({
        id: h._id,
        name: h.name,
        city: h.location.city,
        rating: h.ratingAverage,
        startingPrice: Math.min(...h.roomTypes.map(rt => rt.basePrice)),
        image: h.images[0]
      }))
    };
  }

  static async handlePricingIntent(message) {
    const city = this.extractCity(message);
    
    if (city) {
      const hotels = await Hotel.find({ 
        'location.city': { $regex: city, $options: 'i' },
        isActive: true 
      }).sort({ 'roomTypes.basePrice': 1 }).limit(3);
      
      if (hotels.length > 0) {
        const prices = hotels.map(h => ({
          name: h.name,
          price: Math.min(...h.roomTypes.map(rt => rt.basePrice)),
          rating: h.ratingAverage
        }));
        
        return {
          type: 'pricing_info',
          message: `In ${city}, prices range from ${prices[0].price} to ${prices[prices.length - 1].price} per night.`,
          hotels: prices
        };
      }
    }
    
    return {
      type: 'pricing_info',
      message: 'Hotel prices vary by location and season. Generally, budget hotels start around $30/night, mid-range around $80/night, and luxury hotels from $150/night. Would you like me to search for specific cities?'
    };
  }

  static async handleRecommendationIntent(message) {
    const city = this.extractCity(message);
    const budget = this.extractPriceRange(message);
    
    let query = { isActive: true };
    
    if (city) {
      query['location.city'] = { $regex: city, $options: 'i' };
    }
    
    if (budget) {
      query['roomTypes.basePrice'] = { 
        $gte: budget.min, 
        $lte: budget.max 
      };
    }
    
    const hotels = await Hotel.find(query)
      .sort({ ratingAverage: -1, ratingCount: -1 })
      .limit(3);
    
    if (hotels.length === 0) {
      return {
        type: 'recommendations',
        message: 'I need more information to give you the best recommendations. Tell me about your preferred city and budget.',
        hotels: []
      };
    }
    
    return {
      type: 'recommendations',
      message: `Based on your criteria, here are my top recommendations:`,
      hotels: hotels.map(h => ({
        id: h._id,
        name: h.name,
        city: h.location.city,
        rating: h.ratingAverage,
        reviews: h.ratingCount,
        startingPrice: Math.min(...h.roomTypes.map(rt => rt.basePrice)),
        topAmenities: h.amenities.slice(0, 3),
        image: h.images[0]
      }))
    };
  }

  static async handleBookingIntent(message) {
    if (this.containsKeywords(message.toLowerCase(), ['cancel', 'cancellation'])) {
      return {
        type: 'booking_info',
        message: 'To cancel a booking, please go to your booking history and click on the cancel button. Cancellation policies vary by hotel. Free cancellation is usually available up to 24 hours before check-in.'
      };
    }
    
    return {
      type: 'booking_info',
      message: 'I can help you with booking information. You can book hotels directly on our platform. Just find a hotel you like, select your dates, and proceed to checkout. Need help finding the perfect hotel?'
    };
  }

  static async handleAmenitiesIntent(message) {
    const commonAmenities = [
      'WiFi', 'Parking', 'Swimming Pool', 'Gym', 'Restaurant', 
      'Room Service', 'Spa', 'Pet Friendly', 'Airport Shuttle'
    ];
    
    return {
      type: 'amenities_info',
      message: 'Common hotel amenities include WiFi, parking, swimming pools, gyms, and restaurants. Many hotels also offer room service, spas, and airport shuttles. What specific amenities are you looking for?',
      amenities: commonAmenities
    };
  }

  static generateGeneralResponse(message) {
    const responses = [
      "I'm here to help you find the perfect hotel! You can ask me about hotels in specific cities, pricing, amenities, or booking information.",
      "I can help you search for hotels, compare prices, and get recommendations. What would you like to know?",
      "Feel free to ask me about finding hotels, pricing information, or booking details. How can I assist you today?"
    ];
    
    return {
      type: 'general',
      message: responses[Math.floor(Math.random() * responses.length)]
    };
  }

  static extractCity(message) {
    const cities = ['mumbai', 'delhi', 'bangalore', 'hyderabad', 'chennai', 'kolkata', 'pune', 'jaipur', 'goa', 'ahmedabad'];
    const lowerMessage = message.toLowerCase();
    
    return cities.find(city => lowerMessage.includes(city));
  }

  static extractPriceRange(message) {
    const priceMatch = message.match(/(\$|rs|rupees)?\s*(\d+)\s*(to|-|and)?\s*(\$|rs|rupees)?\s*(\d+)?/i);
    
    if (priceMatch) {
      const min = parseInt(priceMatch[2]);
      const max = priceMatch[5] ? parseInt(priceMatch[5]) : min * 2;
      
      return { min, max };
    }
    
    return null;
  }

  static extractGuests(message) {
    const guestMatch = message.match(/(\d+)\s*(guests?|people?|persons?)/i);
    return guestMatch ? parseInt(guestMatch[1]) : null;
  }
}

module.exports = AIChatbot;
