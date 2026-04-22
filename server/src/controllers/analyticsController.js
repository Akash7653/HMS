const AnalyticsService = require("../services/analyticsService");

// Tracking endpoints
exports.trackPageView = async (req, res, next) => {
  try {
    const trackingData = {
      userId: req.user?.id || null,
      sessionId: req.sessionId || req.headers['x-session-id'] || 'anonymous',
      page: req.body.page || req.headers.referer || '/',
      referrer: req.headers.referer || null,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress,
      duration: req.body.duration
    };

    await AnalyticsService.trackPageView(trackingData);

    res.json({
      success: true,
      message: "Page view tracked successfully"
    });
  } catch (error) {
    console.error('Page view tracking error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to track page view"
    });
  }
};

exports.trackEvent = async (req, res, next) => {
  try {
    const trackingData = {
      userId: req.user?.id || null,
      sessionId: req.sessionId || req.headers['x-session-id'] || 'anonymous',
      eventType: req.body.eventType,
      eventData: req.body.eventData,
      page: req.body.page || req.headers.referer,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress
    };

    if (!trackingData.eventType) {
      return res.status(400).json({
        success: false,
        message: "Event type is required"
      });
    }

    await AnalyticsService.trackEvent(trackingData);

    res.json({
      success: true,
      message: "Event tracked successfully"
    });
  } catch (error) {
    console.error('Event tracking error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to track event"
    });
  }
};

exports.trackConversion = async (req, res, next) => {
  try {
    const trackingData = {
      userId: req.user?.id,
      sessionId: req.sessionId || req.headers['x-session-id'],
      conversionType: req.body.conversionType,
      value: req.body.value,
      bookingId: req.body.bookingId,
      journeySteps: req.body.journeySteps
    };

    if (!trackingData.conversionType) {
      return res.status(400).json({
        success: false,
        message: "Conversion type is required"
      });
    }

    await AnalyticsService.trackConversion(trackingData);

    res.json({
      success: true,
      message: "Conversion tracked successfully"
    });
  } catch (error) {
    console.error('Conversion tracking error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to track conversion"
    });
  }
};

// Analytics dashboard endpoints
exports.getAnalyticsDashboard = async (req, res, next) => {
  try {
    const { dateRange = '30d' } = req.query;
    
    const dashboard = await AnalyticsService.getAnalyticsDashboard(dateRange);

    res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    console.error('Analytics dashboard error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to get analytics dashboard"
    });
  }
};

exports.getUserBehaviorAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { dateRange = '30d' } = req.query;

    const analytics = await AnalyticsService.getUserBehaviorAnalytics(userId, dateRange);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('User behavior analytics error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to get user behavior analytics"
    });
  }
};

exports.getRealTimeMetrics = async (req, res, next) => {
  try {
    const metrics = await AnalyticsService.getRealTimeMetrics();

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Real-time metrics error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to get real-time metrics"
    });
  }
};

// Admin-specific analytics endpoints
exports.getAdminAnalytics = async (req, res, next) => {
  try {
    const { dateRange = '30d', metric } = req.query;

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Admin access required"
      });
    }

    const dashboard = await AnalyticsService.getAnalyticsDashboard(dateRange);

    // Add admin-specific data
    const adminData = {
      ...dashboard,
      systemHealth: await getSystemHealthMetrics(),
      performanceMetrics: await getPerformanceMetrics()
    };

    res.json({
      success: true,
      data: adminData
    });
  } catch (error) {
    console.error('Admin analytics error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to get admin analytics"
    });
  }
};

exports.getRevenueAnalytics = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Admin access required"
      });
    }

    const { dateRange = '30d' } = req.query;
    
    const revenueData = await AnalyticsService.getAnalyticsDashboard(dateRange);
    
    // Additional revenue-specific metrics
    const detailedRevenue = {
      ...revenueData,
      revenueBySource: await getRevenueBySource(dateRange),
      revenueByHotel: await getRevenueByHotel(dateRange),
      revenueByRoomType: await getRevenueByRoomType(dateRange),
      averageOrderValue: await getAverageOrderValue(dateRange)
    };

    res.json({
      success: true,
      data: detailedRevenue
    });
  } catch (error) {
    console.error('Revenue analytics error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to get revenue analytics"
    });
  }
};

exports.getUserAnalytics = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Admin access required"
      });
    }

    const { dateRange = '30d' } = req.query;
    
    const userAnalytics = {
      userGrowth: await getUserGrowthMetrics(dateRange),
      userRetention: await getUserRetentionMetrics(dateRange),
      userDemographics: await getUserDemographics(dateRange),
      topUsers: await getTopUsers(dateRange)
    };

    res.json({
      success: true,
      data: userAnalytics
    });
  } catch (error) {
    console.error('User analytics error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to get user analytics"
    });
  }
};

// Helper functions for admin analytics
async function getSystemHealthMetrics() {
  try {
    // Mock system health metrics
    return {
      serverUptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      databaseStatus: 'healthy',
      cacheStatus: 'healthy'
    };
  } catch (error) {
    console.error('Error getting system health metrics:', error);
    return null;
  }
}

async function getPerformanceMetrics() {
  try {
    // Mock performance metrics
    return {
      avgResponseTime: 150,
      errorRate: 0.02,
      throughput: 1000,
      databaseQueryTime: 25
    };
  } catch (error) {
    console.error('Error getting performance metrics:', error);
    return null;
  }
}

async function getRevenueBySource(dateRange) {
  try {
    // Mock revenue by source data
    return [
      { source: 'Direct', revenue: 50000, percentage: 40 },
      { source: 'Google', revenue: 30000, percentage: 24 },
      { source: 'Social Media', revenue: 25000, percentage: 20 },
      { source: 'Referral', revenue: 20000, percentage: 16 }
    ];
  } catch (error) {
    console.error('Error getting revenue by source:', error);
    return [];
  }
}

async function getRevenueByHotel(dateRange) {
  try {
    // This would aggregate revenue by hotel
    return [];
  } catch (error) {
    console.error('Error getting revenue by hotel:', error);
    return [];
  }
}

async function getRevenueByRoomType(dateRange) {
  try {
    // This would aggregate revenue by room type
    return [
      { roomType: 'Single', revenue: 30000, percentage: 30 },
      { roomType: 'Double', revenue: 50000, percentage: 50 },
      { roomType: 'Suite', revenue: 20000, percentage: 20 }
    ];
  } catch (error) {
    console.error('Error getting revenue by room type:', error);
    return [];
  }
}

async function getAverageOrderValue(dateRange) {
  try {
    // This would calculate average order value
    return 2500;
  } catch (error) {
    console.error('Error getting average order value:', error);
    return 0;
  }
}

async function getUserGrowthMetrics(dateRange) {
  try {
    // Mock user growth data
    return {
      newUsers: 150,
      returningUsers: 850,
      growthRate: 15.5,
      monthlyGrowth: [
        { month: 'Jan', users: 800 },
        { month: 'Feb', users: 920 },
        { month: 'Mar', users: 1000 }
      ]
    };
  } catch (error) {
    console.error('Error getting user growth metrics:', error);
    return null;
  }
}

async function getUserRetentionMetrics(dateRange) {
  try {
    // Mock retention data
    return {
      day1: 85,
      day7: 65,
      day30: 45,
      day90: 25
    };
  } catch (error) {
    console.error('Error getting user retention metrics:', error);
    return null;
  }
}

async function getUserDemographics(dateRange) {
  try {
    // Mock demographic data
    return {
      ageGroups: [
        { range: '18-24', percentage: 20 },
        { range: '25-34', percentage: 35 },
        { range: '35-44', percentage: 25 },
        { range: '45-54', percentage: 15 },
        { range: '55+', percentage: 5 }
      ],
      locations: [
        { city: 'Mumbai', percentage: 25 },
        { city: 'Delhi', percentage: 20 },
        { city: 'Bangalore', percentage: 18 },
        { city: 'Hyderabad', percentage: 15 },
        { city: 'Other', percentage: 22 }
      ],
      devices: [
        { type: 'Mobile', percentage: 60 },
        { type: 'Desktop', percentage: 35 },
        { type: 'Tablet', percentage: 5 }
      ]
    };
  } catch (error) {
    console.error('Error getting user demographics:', error);
    return null;
  }
}

async function getTopUsers(dateRange) {
  try {
    // Mock top users data
    return [
      { userId: '1', name: 'John Doe', bookings: 15, revenue: 45000 },
      { userId: '2', name: 'Jane Smith', bookings: 12, revenue: 38000 },
      { userId: '3', name: 'Bob Johnson', bookings: 10, revenue: 32000 }
    ];
  } catch (error) {
    console.error('Error getting top users:', error);
    return [];
  }
}
