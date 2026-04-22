const redisService = require("../services/redisService");

// Generic cache middleware
const cache = (duration = 300, keyGenerator = null) => {
  return async (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    try {
      // Generate cache key
      const cacheKey = keyGenerator 
        ? keyGenerator(req)
        : `${req.originalUrl}:${JSON.stringify(req.query)}`;

      // Try to get from cache
      const cachedData = await redisService.get(cacheKey);
      
      if (cachedData) {
        // Add cache header
        res.set('X-Cache', 'HIT');
        return res.json(cachedData);
      }

      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = function(data) {
        // Only cache successful responses
        if (res.statusCode === 200) {
          redisService.cacheSearchResults(cacheKey, data, duration).catch(console.error);
        }
        res.set('X-Cache', 'MISS');
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

// Hotel-specific cache middleware
const cacheHotelDetails = (duration = 1800) => {
  return async (req, res, next) => {
    if (req.method !== 'GET') return next();

    try {
      const hotelId = req.params.id || req.params.hotelId;
      if (!hotelId) return next();

      const cacheKey = `hotel:${hotelId}`;
      const cachedData = await redisService.getHotelDetails(hotelId);
      
      if (cachedData) {
        res.set('X-Cache', 'HIT');
        return res.json(cachedData);
      }

      const originalJson = res.json;
      res.json = function(data) {
        if (res.statusCode === 200) {
          redisService.cacheHotelDetails(hotelId, data, duration).catch(console.error);
        }
        res.set('X-Cache', 'MISS');
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Hotel cache middleware error:', error);
      next();
    }
  };
};

// Search results cache middleware
const cacheSearchResults = (duration = 300) => {
  return async (req, res, next) => {
    if (req.method !== 'GET') return next();

    try {
      // Create a deterministic cache key based on search parameters
      const searchParams = {
        city: req.query.city,
        state: req.query.state,
        checkIn: req.query.checkIn,
        checkOut: req.query.checkOut,
        guests: req.query.guests,
        roomType: req.query.roomType,
        minPrice: req.query.minPrice,
        maxPrice: req.query.maxPrice,
        amenities: req.query.amenities,
        rating: req.query.rating,
        page: req.query.page || 1,
        limit: req.query.limit || 10,
        sort: req.query.sort
      };

      // Remove undefined values
      Object.keys(searchParams).forEach(key => {
        if (searchParams[key] === undefined) delete searchParams[key];
      });

      const cacheKey = `search:${JSON.stringify(searchParams)}`;
      const cachedData = await redisService.getSearchResults(cacheKey);
      
      if (cachedData) {
        res.set('X-Cache', 'HIT');
        return res.json(cachedData);
      }

      const originalJson = res.json;
      res.json = function(data) {
        if (res.statusCode === 200) {
          redisService.cacheSearchResults(cacheKey, data, duration).catch(console.error);
        }
        res.set('X-Cache', 'MISS');
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Search cache middleware error:', error);
      next();
    }
  };
};

// Availability cache middleware
const cacheAvailability = (duration = 60) => {
  return async (req, res, next) => {
    if (req.method !== 'GET') return next();

    try {
      const hotelId = req.query.hotelId;
      const checkIn = req.query.checkIn;
      const checkOut = req.query.checkOut;
      
      if (!hotelId || !checkIn || !checkOut) return next();

      const dateRange = `${checkIn}-${checkOut}`;
      const cacheKey = `availability:${hotelId}:${dateRange}`;
      const cachedData = await redisService.getAvailability(hotelId, dateRange);
      
      if (cachedData) {
        res.set('X-Cache', 'HIT');
        return res.json(cachedData);
      }

      const originalJson = res.json;
      res.json = function(data) {
        if (res.statusCode === 200) {
          redisService.cacheAvailability(hotelId, dateRange, data, duration).catch(console.error);
        }
        res.set('X-Cache', 'MISS');
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Availability cache middleware error:', error);
      next();
    }
  };
};

// Recommendations cache middleware
const cacheRecommendations = (duration = 3600) => {
  return async (req, res, next) => {
    if (req.method !== 'GET') return next();

    try {
      const userId = req.user?.id;
      if (!userId) return next();

      const cachedData = await redisService.getRecommendations(userId);
      
      if (cachedData) {
        res.set('X-Cache', 'HIT');
        return res.json(cachedData);
      }

      const originalJson = res.json;
      res.json = function(data) {
        if (res.statusCode === 200) {
          redisService.cacheRecommendations(userId, data, duration).catch(console.error);
        }
        res.set('X-Cache', 'MISS');
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Recommendations cache middleware error:', error);
      next();
    }
  };
};

// Pricing insights cache middleware
const cachePricingInsights = (duration = 1800) => {
  return async (req, res, next) => {
    if (req.method !== 'GET') return next();

    try {
      const hotelId = req.query.hotelId;
      const checkInDate = req.query.checkInDate;
      
      if (!hotelId || !checkInDate) return next();

      const cachedData = await redisService.getPricingInsights(hotelId, checkInDate);
      
      if (cachedData) {
        res.set('X-Cache', 'HIT');
        return res.json(cachedData);
      }

      const originalJson = res.json;
      res.json = function(data) {
        if (res.statusCode === 200) {
          redisService.cachePricingInsights(hotelId, checkInDate, data, duration).catch(console.error);
        }
        res.set('X-Cache', 'MISS');
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Pricing insights cache middleware error:', error);
      next();
    }
  };
};

// Cache invalidation middleware
const invalidateCache = (pattern) => {
  return async (req, res, next) => {
    const originalJson = res.json;
    
    res.json = function(data) {
      // Invalidate cache on successful POST/PUT/DELETE
      if (res.statusCode >= 200 && res.statusCode < 300) {
        if (pattern.includes(':hotelId:')) {
          const hotelId = req.params.id || req.params.hotelId;
          if (hotelId) {
            redisService.invalidateHotelCache(hotelId).catch(console.error);
          }
        }
        
        if (pattern.includes(':userId:')) {
          const userId = req.user?.id;
          if (userId) {
            redisService.invalidateUserCache(userId).catch(console.error);
          }
        }
      }
      
      return originalJson.call(this, data);
    };

    next();
  };
};

module.exports = {
  cache,
  cacheHotelDetails,
  cacheSearchResults,
  cacheAvailability,
  cacheRecommendations,
  cachePricingInsights,
  invalidateCache
};
