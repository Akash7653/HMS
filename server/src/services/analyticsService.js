const Analytics = require("../models/Analytics");
const UserBehavior = require("../models/UserBehavior");
const Booking = require("../models/Booking");
const Hotel = require("../models/Hotel");
const dayjs = require("dayjs");

class AnalyticsService {
  static async trackPageView(data) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let analytics = await Analytics.findOne({ date: today });
      if (!analytics) {
        analytics = new Analytics({ date: today });
      }

      const pageView = {
        userId: data.userId || null,
        sessionId: data.sessionId,
        page: data.page,
        referrer: data.referrer,
        userAgent: data.userAgent,
        ip: data.ip,
        timestamp: new Date(),
        duration: data.duration,
        device: this.extractDevice(data.userAgent),
        browser: this.extractBrowser(data.userAgent),
        os: this.extractOS(data.userAgent)
      };

      analytics.pageViews.push(pageView);
      await analytics.save();

      // Update summary asynchronously
      this.updateDailySummary(today).catch(console.error);

      return pageView;
    } catch (error) {
      console.error('Error tracking page view:', error);
      throw error;
    }
  }

  static async trackEvent(data) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let analytics = await Analytics.findOne({ date: today });
      if (!analytics) {
        analytics = new Analytics({ date: today });
      }

      const event = {
        userId: data.userId || null,
        sessionId: data.sessionId,
        eventType: data.eventType,
        eventData: data.eventData,
        page: data.page,
        timestamp: new Date(),
        ip: data.ip,
        userAgent: data.userAgent
      };

      analytics.events.push(event);
      await analytics.save();

      // Update summary asynchronously
      this.updateDailySummary(today).catch(console.error);

      return event;
    } catch (error) {
      console.error('Error tracking event:', error);
      throw error;
    }
  }

  static async trackConversion(data) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let analytics = await Analytics.findOne({ date: today });
      if (!analytics) {
        analytics = new Analytics({ date: today });
      }

      const conversion = {
        userId: data.userId,
        sessionId: data.sessionId,
        conversionType: data.conversionType,
        value: data.value,
        bookingId: data.bookingId,
        timestamp: new Date(),
        journeySteps: data.journeySteps || []
      };

      analytics.conversions.push(conversion);
      await analytics.save();

      // Update summary asynchronously
      this.updateDailySummary(today).catch(console.error);

      return conversion;
    } catch (error) {
      console.error('Error tracking conversion:', error);
      throw error;
    }
  }

  static async updateDailySummary(date) {
    try {
      const analytics = await Analytics.findOne({ date });
      if (!analytics) return;

      // Calculate summary metrics
      const summary = {
        totalPageViews: analytics.pageViews.length,
        uniqueVisitors: new Set(analytics.pageViews.map(pv => pv.sessionId)).size,
        totalSessions: new Set(analytics.pageViews.map(pv => pv.sessionId)).size,
        avgSessionDuration: this.calculateAvgSessionDuration(analytics.pageViews),
        bounceRate: this.calculateBounceRate(analytics.pageViews),
        conversionRate: this.calculateConversionRate(analytics),
        totalRevenue: analytics.conversions.reduce((sum, c) => sum + (c.value || 0), 0),
        totalBookings: analytics.conversions.filter(c => c.conversionType === 'booking_completed').length,
        topPages: this.getTopPages(analytics.pageViews),
        topEvents: this.getTopEvents(analytics.events),
        deviceBreakdown: this.getDeviceBreakdown(analytics.pageViews),
        trafficSources: this.getTrafficSources(analytics.pageViews)
      };

      analytics.summary = summary;
      await analytics.save();
    } catch (error) {
      console.error('Error updating daily summary:', error);
    }
  }

  static async getAnalyticsDashboard(dateRange = '30d') {
    try {
      const endDate = new Date();
      const startDate = this.getStartDate(dateRange, endDate);

      const analytics = await Analytics.find({
        date: { $gte: startDate, $lte: endDate }
      }).sort({ date: -1 });

      // Aggregate data across the date range
      const aggregatedData = this.aggregateAnalyticsData(analytics);

      // Get additional metrics
      const [bookingTrends, topHotels, userGrowth] = await Promise.all([
        this.getBookingTrends(startDate, endDate),
        this.getTopHotels(startDate, endDate),
        this.getUserGrowth(startDate, endDate)
      ]);

      return {
        dateRange: { startDate, endDate },
        summary: aggregatedData,
        bookingTrends,
        topHotels,
        userGrowth,
        dailyData: analytics.map(a => ({
          date: a.date,
          pageViews: a.summary.totalPageViews,
          uniqueVisitors: a.summary.uniqueVisitors,
          conversions: a.conversions.length,
          revenue: a.summary.totalRevenue
        }))
      };
    } catch (error) {
      console.error('Error getting analytics dashboard:', error);
      throw error;
    }
  }

  static async getUserBehaviorAnalytics(userId, dateRange = '30d') {
    try {
      const endDate = new Date();
      const startDate = this.getStartDate(dateRange, endDate);

      const [userBehavior, bookings, analytics] = await Promise.all([
        UserBehavior.find({ 
          user: userId, 
          timestamp: { $gte: startDate, $lte: endDate } 
        }).sort({ timestamp: -1 }),
        Booking.find({ 
          user: userId, 
          createdAt: { $gte: startDate, $lte: endDate } 
        }),
        Analytics.find({
          date: { $gte: startDate, $lte: endDate },
          "pageViews.userId": userId
        })
      ]);

      return {
        userBehavior: this.categorizeUserBehavior(userBehavior),
        bookingHistory: bookings,
        pageViews: analytics.flatMap(a => a.pageViews.filter(pv => pv.userId.toString() === userId)),
        events: analytics.flatMap(a => a.events.filter(e => e.userId?.toString() === userId)),
        summary: {
          totalSessions: new Set(userBehavior.map(b => b.sessionId)).size,
          totalBookings: bookings.length,
          avgSessionDuration: this.calculateAvgSessionDuration(
            analytics.flatMap(a => a.pageViews.filter(pv => pv.userId?.toString() === userId))
          ),
          preferredCities: this.getPreferredCities(userBehavior),
          preferredPriceRange: this.getPreferredPriceRange(userBehavior)
        }
      };
    } catch (error) {
      console.error('Error getting user behavior analytics:', error);
      throw error;
    }
  }

  static async getRealTimeMetrics() {
    try {
      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const [activeUsers, recentBookings, recentPageViews] = await Promise.all([
        Analytics.aggregate([
          { $match: { date: { $gte: last24Hours } } },
          { $unwind: "$pageViews" },
          { $match: { "pageViews.timestamp": { $gte: last24Hours } } },
          { $group: { _id: "$pageViews.sessionId" } },
          { $count: "activeUsers" }
        ]),
        Booking.countDocuments({ createdAt: { $gte: last24Hours } }),
        Analytics.aggregate([
          { $match: { date: { $gte: last24Hours } } },
          { $unwind: "$pageViews" },
          { $match: { "pageViews.timestamp": { $gte: last24Hours } } },
          { $count: "pageViews" }
        ])
      ]);

      return {
        activeUsers: activeUsers[0]?.activeUsers || 0,
        recentBookings,
        recentPageViews: recentPageViews[0]?.pageViews || 0,
        timestamp: now
      };
    } catch (error) {
      console.error('Error getting real-time metrics:', error);
      throw error;
    }
  }

  // Helper methods
  static extractDevice(userAgent) {
    if (!userAgent) return 'Unknown';
    
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      return /iPad/.test(userAgent) ? 'Tablet' : 'Mobile';
    }
    return 'Desktop';
  }

  static extractBrowser(userAgent) {
    if (!userAgent) return 'Unknown';
    
    if (/Chrome/.test(userAgent)) return 'Chrome';
    if (/Firefox/.test(userAgent)) return 'Firefox';
    if (/Safari/.test(userAgent)) return 'Safari';
    if (/Edge/.test(userAgent)) return 'Edge';
    return 'Other';
  }

  static extractOS(userAgent) {
    if (!userAgent) return 'Unknown';
    
    if (/Windows/.test(userAgent)) return 'Windows';
    if (/Mac/.test(userAgent)) return 'macOS';
    if (/Linux/.test(userAgent)) return 'Linux';
    if (/Android/.test(userAgent)) return 'Android';
    if (/iOS|iPhone|iPad/.test(userAgent)) return 'iOS';
    return 'Other';
  }

  static calculateAvgSessionDuration(pageViews) {
    const sessions = {};
    
    pageViews.forEach(pv => {
      if (!sessions[pv.sessionId]) {
        sessions[pv.sessionId] = { start: pv.timestamp, end: pv.timestamp };
      } else {
        sessions[pv.sessionId].end = pv.timestamp;
      }
    });

    const durations = Object.values(sessions).map(session => 
      (session.end - session.start) / 1000 // Convert to seconds
    ).filter(d => d > 0 && d < 3600); // Filter out unrealistic durations

    return durations.length > 0 ? durations.reduce((sum, d) => sum + d, 0) / durations.length : 0;
  }

  static calculateBounceRate(pageViews) {
    const sessions = {};
    
    pageViews.forEach(pv => {
      if (!sessions[pv.sessionId]) {
        sessions[pv.sessionId] = 0;
      }
      sessions[pv.sessionId]++;
    });

    const bouncedSessions = Object.values(sessions).filter(count => count === 1).length;
    const totalSessions = Object.keys(sessions).length;

    return totalSessions > 0 ? (bouncedSessions / totalSessions) * 100 : 0;
  }

  static calculateConversionRate(analytics) {
    const totalSessions = new Set(analytics.pageViews.map(pv => pv.sessionId)).size;
    const conversionsWithSession = analytics.conversions.filter(c => 
      analytics.pageViews.some(pv => pv.sessionId === c.sessionId)
    ).length;

    return totalSessions > 0 ? (conversionsWithSession / totalSessions) * 100 : 0;
  }

  static getTopPages(pageViews) {
    const pageCounts = {};
    pageViews.forEach(pv => {
      pageCounts[pv.page] = (pageCounts[pv.page] || 0) + 1;
    });

    return Object.entries(pageCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([page, views]) => ({ page, views }));
  }

  static getTopEvents(events) {
    const eventCounts = {};
    events.forEach(event => {
      eventCounts[event.eventType] = (eventCounts[event.eventType] || 0) + 1;
    });

    return Object.entries(eventCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([eventType, count]) => ({ eventType, count }));
  }

  static getDeviceBreakdown(pageViews) {
    const deviceCounts = {};
    pageViews.forEach(pv => {
      deviceCounts[pv.device] = (deviceCounts[pv.device] || 0) + 1;
    });

    const total = pageViews.length;
    return Object.entries(deviceCounts)
      .sort(([,a], [,b]) => b - a)
      .map(([device, count]) => ({
        device,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      }));
  }

  static getTrafficSources(pageViews) {
    const sourceCounts = {};
    pageViews.forEach(pv => {
      const source = pv.referrer || 'Direct';
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
    });

    const total = pageViews.length;
    return Object.entries(sourceCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([source, count]) => ({
        source,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      }));
  }

  static getStartDate(dateRange, endDate) {
    const days = parseInt(dateRange.replace('d', ''));
    return new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
  }

  static aggregateAnalyticsData(analytics) {
    return {
      totalPageViews: analytics.reduce((sum, a) => sum + a.summary.totalPageViews, 0),
      uniqueVisitors: analytics.reduce((sum, a) => sum + a.summary.uniqueVisitors, 0),
      totalSessions: analytics.reduce((sum, a) => sum + a.summary.totalSessions, 0),
      avgSessionDuration: analytics.reduce((sum, a) => sum + a.summary.avgSessionDuration, 0) / analytics.length,
      bounceRate: analytics.reduce((sum, a) => sum + a.summary.bounceRate, 0) / analytics.length,
      conversionRate: analytics.reduce((sum, a) => sum + a.summary.conversionRate, 0) / analytics.length,
      totalRevenue: analytics.reduce((sum, a) => sum + a.summary.totalRevenue, 0),
      totalBookings: analytics.reduce((sum, a) => sum + a.summary.totalBookings, 0)
    };
  }

  static async getBookingTrends(startDate, endDate) {
    return Booking.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
          revenue: { $sum: "$totalPrice" }
        }
      },
      { $sort: { _id: 1 } }
    ]);
  }

  static async getTopHotels(startDate, endDate) {
    return Booking.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: "$hotel",
          bookings: { $sum: 1 },
          revenue: { $sum: "$totalPrice" }
        }
      },
      { $sort: { bookings: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'hotels',
          localField: '_id',
          foreignField: '_id',
          as: 'hotelInfo'
        }
      },
      { $unwind: '$hotelInfo' }
    ]);
  }

  static async getUserGrowth(startDate, endDate) {
    // This would require a User model with createdAt field
    // For now, returning mock data
    return {
      newUsers: 0,
      returningUsers: 0,
      growthRate: 0
    };
  }

  static categorizeUserBehavior(behavior) {
    const categories = {
      search: behavior.filter(b => b.type === 'search'),
      view: behavior.filter(b => b.type === 'view'),
      wishlist: behavior.filter(b => b.type === 'wishlist'),
      booking: behavior.filter(b => b.type === 'booking'),
      click: behavior.filter(b => b.type === 'click')
    };

    return Object.entries(categories).map(([type, items]) => ({
      type,
      count: items.length,
      recent: items.slice(0, 5)
    }));
  }

  static getPreferredCities(behavior) {
    const cityCounts = {};
    behavior.forEach(b => {
      if (b.searchData?.city) {
        cityCounts[b.searchData.city] = (cityCounts[b.searchData.city] || 0) + 1;
      }
    });

    return Object.entries(cityCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([city, count]) => ({ city, count }));
  }

  static getPreferredPriceRange(behavior) {
    const prices = behavior
      .filter(b => b.searchData?.priceRange?.min)
      .map(b => b.searchData.priceRange.min);

    if (prices.length === 0) return null;

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const avg = prices.reduce((sum, p) => sum + p, 0) / prices.length;

    return { min, max, average: avg };
  }
}

module.exports = AnalyticsService;
