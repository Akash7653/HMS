const Hotel = require("../models/Hotel");
const Booking = require("../models/Booking");

class MapService {
  static async getHeatmapData(city, dateRange = null) {
    try {
      let query = { isActive: true };
      
      if (city) {
        query["location.city"] = { $regex: city, $options: 'i' };
      }

      const hotels = await Hotel.find(query, {
        "location.coordinates": 1,
        "location.city": 1,
        ratingAverage: 1,
        ratingCount: 1,
        "roomTypes.basePrice": 1
      });

      // Calculate intensity based on multiple factors
      const heatmapData = hotels.map(hotel => {
        const basePrice = hotel.roomTypes[0]?.basePrice || 0;
        const rating = hotel.ratingAverage || 0;
        const reviewCount = hotel.ratingCount || 0;
        
        // Intensity calculation (0-1)
        let intensity = 0;
        
        // Rating contributes 40%
        intensity += (rating / 5) * 0.4;
        
        // Review count contributes 30% (normalized)
        intensity += Math.min(reviewCount / 100, 1) * 0.3;
        
        // Price popularity contributes 30% (moderate prices get higher intensity)
        const priceScore = basePrice < 2000 ? 0.3 : basePrice < 5000 ? 0.7 : 0.4;
        intensity += priceScore * 0.3;

        return {
          lat: hotel.location.coordinates.lat,
          lng: hotel.location.coordinates.lng,
          intensity: Math.min(1, intensity),
          hotelId: hotel._id,
          city: hotel.location.city,
          rating,
          price: basePrice
        };
      });

      // Group by area for better heatmap visualization
      const groupedData = this.groupByArea(heatmapData);
      
      return {
        success: true,
        data: groupedData,
        totalHotels: hotels.length
      };
    } catch (error) {
      console.error('Error generating heatmap data:', error);
      return { success: false, error: error.message };
    }
  }

  static async searchByPolygon(polygonCoordinates, filters = {}) {
    try {
      // Create GeoJSON polygon
      const polygon = {
        type: "Polygon",
        coordinates: [polygonCoordinates]
      };

      let query = {
        isActive: true,
        "location.coordinates": {
          $geoWithin: {
            $geometry: polygon
          }
        }
      };

      // Apply additional filters
      if (filters.minPrice || filters.maxPrice) {
        query["roomTypes"] = {
          $elemMatch: {
            basePrice: {
              ...(filters.minPrice ? { $gte: Number(filters.minPrice) } : {}),
              ...(filters.maxPrice ? { $lte: Number(filters.maxPrice) } : {})
            }
          }
        };
      }

      if (filters.rating) {
        query.ratingAverage = { $gte: Number(filters.rating) };
      }

      if (filters.amenities && filters.amenities.length > 0) {
        query.amenities = { $all: filters.amenities };
      }

      const hotels = await Hotel.find(query)
        .populate('reviews')
        .sort({ ratingAverage: -1 });

      // Add price overlays and availability
      const hotelsWithOverlay = await Promise.all(
        hotels.map(async (hotel) => {
          const basePrice = hotel.roomTypes[0]?.basePrice || 0;
          
          // Get recent booking activity for this hotel
          const recentBookings = await Booking.countDocuments({
            hotel: hotel._id,
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            bookingStatus: 'confirmed'
          });

          return {
            ...hotel.toObject(),
            priceOverlay: {
              price: basePrice,
              demand: this.calculateDemandLevel(recentBookings),
              trending: recentBookings > 5
            },
            markerType: this.getMarkerType(hotel, recentBookings)
          };
        })
      );

      return {
        success: true,
        data: hotelsWithOverlay,
        count: hotelsWithOverlay.length
      };
    } catch (error) {
      console.error('Error searching by polygon:', error);
      return { success: false, error: error.message };
    }
  }

  static async getPriceOverlays(city, bounds = null) {
    try {
      let query = { isActive: true };
      
      if (city) {
        query["location.city"] = { $regex: city, $options: 'i' };
      }

      // Add geographic bounds if provided
      if (bounds) {
        query["location.coordinates"] = {
          $geoWithin: {
            $box: [
              [bounds.sw.lng, bounds.sw.lat],
              [bounds.ne.lng, bounds.ne.lat]
            ]
          }
        };
      }

      const hotels = await Hotel.find(query, {
        "location.coordinates": 1,
        "location.city": 1,
        "roomTypes.basePrice": 1,
        ratingAverage: 1
      });

      // Create price overlay data
      const priceData = hotels.map(hotel => {
        const basePrice = hotel.roomTypes[0]?.basePrice || 0;
        const priceCategory = this.getPriceCategory(basePrice);
        
        return {
          lat: hotel.location.coordinates.lat,
          lng: hotel.location.coordinates.lng,
          price: basePrice,
          category: priceCategory,
          color: this.getPriceColor(priceCategory),
          rating: hotel.ratingAverage,
          hotelId: hotel._id
        };
      });

      // Calculate price clusters
      const clusters = this.createPriceClusters(priceData);

      return {
        success: true,
        data: priceData,
        clusters,
        priceRanges: {
          budget: { min: 0, max: 2000, color: '#22c55e' },
          moderate: { min: 2000, max: 5000, color: '#3b82f6' },
          expensive: { min: 5000, max: 10000, color: '#f59e0b' },
          luxury: { min: 10000, max: Infinity, color: '#ef4444' }
        }
      };
    } catch (error) {
      console.error('Error getting price overlays:', error);
      return { success: false, error: error.message };
    }
  }

  static async getPopularAreas(city, limit = 10) {
    try {
      const bookings = await Booking.aggregate([
        {
          $match: {
            bookingStatus: 'confirmed',
            createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $lookup: {
            from: 'hotels',
            localField: 'hotel',
            foreignField: '_id',
            as: 'hotelInfo'
          }
        },
        {
          $unwind: '$hotelInfo'
        },
        {
          $match: {
            'hotelInfo.location.city': { $regex: city, $options: 'i' }
          }
        },
        {
          $group: {
            _id: '$hotelInfo.location.city',
            totalBookings: { $sum: 1 },
            avgRating: { $avg: '$hotelInfo.ratingAverage' },
            avgPrice: { $avg: '$hotelInfo.roomTypes.basePrice' },
            hotels: { $addToSet: '$hotelInfo' }
          }
        },
        {
          $addFields: {
            popularityScore: {
              $add: [
                { $multiply: ['$totalBookings', 0.6] },
                { $multiply: ['$avgRating', 0.2] },
                { $multiply: [{ $divide: ['$avgPrice', 1000] }, 0.2] }
              ]
            }
          }
        },
        { $sort: { popularityScore: -1 } },
        { $limit: limit }
      ]);

      return {
        success: true,
        data: bookings.map(area => ({
          city: area._id,
          popularityScore: area.popularityScore,
          totalBookings: area.totalBookings,
          avgRating: Math.round(area.avgRating * 10) / 10,
          avgPrice: Math.round(area.avgPrice),
          hotelCount: area.hotels.length,
          hotels: area.hotels.slice(0, 5) // Top 5 hotels in area
        }))
      };
    } catch (error) {
      console.error('Error getting popular areas:', error);
      return { success: false, error: error.message };
    }
  }

  static async getMapSearchSuggestions(query, location = null) {
    try {
      const suggestions = [];

      // City suggestions
      if (!location || query.length < 3) {
        const cities = await Hotel.distinct("location.city", {
          "location.city": { $regex: query, $options: 'i' },
          isActive: true
        });

        suggestions.push(...cities.slice(0, 5).map(city => ({
          type: 'city',
          name: city,
          displayName: city
        })));
      }

      // Landmark suggestions (simplified - using hotel names as landmarks)
      const hotels = await Hotel.find({
        name: { $regex: query, $options: 'i' },
        isActive: true
      }, {
        name: 1,
        "location.city": 1,
        "location.address": 1
      }).limit(5);

      suggestions.push(...hotels.map(hotel => ({
        type: 'hotel',
        name: hotel.name,
        displayName: `${hotel.name}, ${hotel.location.city}`,
        city: hotel.location.city,
        address: hotel.location.address
      })));

      // Trending locations
      const trending = await Booking.aggregate([
        {
          $match: {
            bookingStatus: 'confirmed',
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $lookup: {
            from: 'hotels',
            localField: 'hotel',
            foreignField: '_id',
            as: 'hotelInfo'
          }
        },
        {
          $unwind: '$hotelInfo'
        },
        {
          $group: {
            _id: '$hotelInfo.location.city',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 3 }
      ]);

      suggestions.push(...trending.map(trend => ({
        type: 'trending',
        name: trend._id,
        displayName: `Trending: ${trend._id}`,
        trending: true
      })));

      return {
        success: true,
        data: suggestions.slice(0, 10)
      };
    } catch (error) {
      console.error('Error getting map search suggestions:', error);
      return { success: false, error: error.message };
    }
  }

  // Helper methods
  static groupByArea(data, gridSize = 0.01) {
    const groups = {};
    
    data.forEach(point => {
      const latGrid = Math.floor(point.lat / gridSize) * gridSize;
      const lngGrid = Math.floor(point.lng / gridSize) * gridSize;
      const key = `${latGrid},${lngGrid}`;
      
      if (!groups[key]) {
        groups[key] = {
          lat: latGrid,
          lng: lngGrid,
          points: [],
          totalIntensity: 0
        };
      }
      
      groups[key].points.push(point);
      groups[key].totalIntensity += point.intensity;
    });

    return Object.values(groups).map(group => ({
      lat: group.lat,
      lng: group.lng,
      intensity: Math.min(1, group.totalIntensity / group.points.length),
      pointCount: group.points.length,
      hotels: group.points
    }));
  }

  static calculateDemandLevel(recentBookings) {
    if (recentBookings >= 10) return 'high';
    if (recentBookings >= 5) return 'medium';
    return 'low';
  }

  static getMarkerType(hotel, recentBookings) {
    if (recentBookings >= 10) return 'trending';
    if (hotel.ratingAverage >= 4.5) return 'premium';
    if (hotel.ratingAverage >= 4.0) return 'popular';
    return 'standard';
  }

  static getPriceCategory(price) {
    if (price < 2000) return 'budget';
    if (price < 5000) return 'moderate';
    if (price < 10000) return 'expensive';
    return 'luxury';
  }

  static getPriceColor(category) {
    const colors = {
      budget: '#22c55e',      // Green
      moderate: '#3b82f6',    // Blue
      expensive: '#f59e0b',  // Amber
      luxury: '#ef4444'       // Red
    };
    return colors[category] || '#6b7280';
  }

  static createPriceClusters(data, clusterRadius = 0.005) {
    const clusters = [];
    const processed = new Set();

    data.forEach(point => {
      if (processed.has(point.hotelId.toString())) return;

      const cluster = {
        center: { lat: point.lat, lng: point.lng },
        points: [point],
        avgPrice: point.price,
        category: point.category
      };

      // Find nearby points
      data.forEach(otherPoint => {
        if (processed.has(otherPoint.hotelId.toString())) return;
        
        const distance = this.calculateDistance(
          point.lat, point.lng,
          otherPoint.lat, otherPoint.lng
        );

        if (distance < clusterRadius && point.category === otherPoint.category) {
          cluster.points.push(otherPoint);
          cluster.avgPrice = (cluster.avgPrice + otherPoint.price) / 2;
          processed.add(otherPoint.hotelId.toString());
        }
      });

      if (cluster.points.length > 1) {
        clusters.push(cluster);
      }

      processed.add(point.hotelId.toString());
    });

    return clusters;
  }

  static calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}

module.exports = MapService;
