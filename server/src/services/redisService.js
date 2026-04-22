const redis = require('redis');

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      // Support both traditional Redis and Upstash HTTPS URLs
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      // For Upstash (HTTPS), use different configuration
      if (redisUrl.startsWith('https://')) {
        // Upstash uses REST API, not direct Redis protocol
        const axios = require('axios');
        this.httpClient = axios.create({
          baseURL: redisUrl,
          headers: {
            'Authorization': `Bearer ${process.env.REDIS_PASSWORD || ''}`
          }
        });
        console.log('Upstash Redis client configured');
        this.isConnected = true;
        return true;
      }
      
      // Traditional Redis connection
      this.client = redis.createClient({
        url: redisUrl
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis Client Connected');
        this.isConnected = true;
      });

      await this.client.connect();
      return true;
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      this.isConnected = false;
      return false;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }

  // Cache hotel search results
  async cacheSearchResults(searchKey, results, ttl = 300) { // 5 minutes default
    if (!this.isConnected) return false;
    
    try {
      await this.client.setEx(searchKey, ttl, JSON.stringify(results));
      return true;
    } catch (error) {
      console.error('Error caching search results:', error);
      return false;
    }
  }

  async getSearchResults(searchKey) {
    if (!this.isConnected) return null;
    
    try {
      const cached = await this.client.get(searchKey);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Error getting search results:', error);
      return null;
    }
  }

  // Cache hotel details
  async cacheHotelDetails(hotelId, hotelData, ttl = 1800) { // 30 minutes
    if (!this.isConnected) return false;
    
    try {
      const key = `hotel:${hotelId}`;
      await this.client.setEx(key, ttl, JSON.stringify(hotelData));
      return true;
    } catch (error) {
      console.error('Error caching hotel details:', error);
      return false;
    }
  }

  async getHotelDetails(hotelId) {
    if (!this.isConnected) return null;
    
    try {
      const key = `hotel:${hotelId}`;
      const cached = await this.client.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Error getting hotel details:', error);
      return null;
    }
  }

  // Cache availability data
  async cacheAvailability(hotelId, dateRange, availability, ttl = 60) { // 1 minute
    if (!this.isConnected) return false;
    
    try {
      const key = `availability:${hotelId}:${dateRange}`;
      await this.client.setEx(key, ttl, JSON.stringify(availability));
      return true;
    } catch (error) {
      console.error('Error caching availability:', error);
      return false;
    }
  }

  async getAvailability(hotelId, dateRange) {
    if (!this.isConnected) return null;
    
    try {
      const key = `availability:${hotelId}:${dateRange}`;
      const cached = await this.client.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Error getting availability:', error);
      return null;
    }
  }

  // Cache user recommendations
  async cacheRecommendations(userId, recommendations, ttl = 3600) { // 1 hour
    if (!this.isConnected) return false;
    
    try {
      const key = `recommendations:${userId}`;
      await this.client.setEx(key, ttl, JSON.stringify(recommendations));
      return true;
    } catch (error) {
      console.error('Error caching recommendations:', error);
      return false;
    }
  }

  async getRecommendations(userId) {
    if (!this.isConnected) return null;
    
    try {
      const key = `recommendations:${userId}`;
      const cached = await this.client.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return null;
    }
  }

  // Cache pricing insights
  async cachePricingInsights(hotelId, checkInDate, insights, ttl = 1800) { // 30 minutes
    if (!this.isConnected) return false;
    
    try {
      const key = `pricing:${hotelId}:${checkInDate}`;
      await this.client.setEx(key, ttl, JSON.stringify(insights));
      return true;
    } catch (error) {
      console.error('Error caching pricing insights:', error);
      return false;
    }
  }

  async getPricingInsights(hotelId, checkInDate) {
    if (!this.isConnected) return null;
    
    try {
      const key = `pricing:${hotelId}:${checkInDate}`;
      const cached = await this.client.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Error getting pricing insights:', error);
      return null;
    }
  }

  // Rate limiting
  async incrementRateLimit(key, windowMs, maxRequests) {
    if (!this.isConnected) return { allowed: true, remaining: maxRequests };
    
    try {
      const current = await this.client.incr(key);
      
      if (current === 1) {
        await this.client.expire(key, Math.ceil(windowMs / 1000));
      }
      
      const remaining = Math.max(0, maxRequests - current);
      const allowed = current <= maxRequests;
      
      return { allowed, remaining, current };
    } catch (error) {
      console.error('Error with rate limiting:', error);
      return { allowed: true, remaining: maxRequests };
    }
  }

  // Session management
  async setSession(sessionId, sessionData, ttl = 86400) { // 24 hours
    if (!this.isConnected) return false;
    
    try {
      await this.client.setEx(`session:${sessionId}`, ttl, JSON.stringify(sessionData));
      return true;
    } catch (error) {
      console.error('Error setting session:', error);
      return false;
    }
  }

  async getSession(sessionId) {
    if (!this.isConnected) return null;
    
    try {
      const cached = await this.client.get(`session:${sessionId}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  async deleteSession(sessionId) {
    if (!this.isConnected) return false;
    
    try {
      await this.client.del(`session:${sessionId}`);
      return true;
    } catch (error) {
      console.error('Error deleting session:', error);
      return false;
    }
  }

  // Cache invalidation
  async invalidateHotelCache(hotelId) {
    if (!this.isConnected) return false;
    
    try {
      const keys = await this.client.keys(`*${hotelId}*`);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      console.error('Error invalidating hotel cache:', error);
      return false;
    }
  }

  async invalidateUserCache(userId) {
    if (!this.isConnected) return false;
    
    try {
      const keys = await this.client.keys(`*${userId}*`);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      console.error('Error invalidating user cache:', error);
      return false;
    }
  }

  // Analytics and metrics
  async trackEvent(event, data) {
    if (!this.isConnected) return false;
    
    try {
      const key = `events:${event}:${new Date().toISOString().split('T')[0]}`;
      await this.client.incr(key);
      await this.client.expire(key, 86400 * 30); // Keep for 30 days
      return true;
    } catch (error) {
      console.error('Error tracking event:', error);
      return false;
    }
  }

  async getEventCount(event, date) {
    if (!this.isConnected) return 0;
    
    try {
      const key = `events:${event}:${date}`;
      const count = await this.client.get(key);
      return parseInt(count) || 0;
    } catch (error) {
      console.error('Error getting event count:', error);
      return 0;
    }
  }

  // Health check
  async healthCheck() {
    if (!this.isConnected) return false;
    
    try {
      await this.client.ping();
      return true;
    } catch (error) {
      console.error('Redis health check failed:', error);
      return false;
    }
  }
}

const redisService = new RedisService();

// Auto-connect on module load
redisService.connect().catch(console.error);

module.exports = redisService;
