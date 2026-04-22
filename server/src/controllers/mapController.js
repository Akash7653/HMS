const MapService = require("../services/mapService");

exports.getHeatmapData = async (req, res, next) => {
  try {
    const { city, dateRange } = req.query;
    
    const result = await MapService.getHeatmapData(city, dateRange);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate heatmap data',
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.data,
      totalHotels: result.totalHotels
    });
  } catch (error) {
    console.error('Heatmap controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

exports.searchByPolygon = async (req, res, next) => {
  try {
    const { polygon, filters } = req.body;
    
    if (!polygon || !Array.isArray(polygon) || polygon.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Valid polygon coordinates are required'
      });
    }

    const result = await MapService.searchByPolygon(polygon, filters || {});
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to search by polygon',
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.data,
      count: result.count
    });
  } catch (error) {
    console.error('Polygon search controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

exports.getPriceOverlays = async (req, res, next) => {
  try {
    const { city, bounds } = req.query;
    
    const result = await MapService.getPriceOverlays(city, bounds ? JSON.parse(bounds) : null);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to get price overlays',
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.data,
      clusters: result.clusters,
      priceRanges: result.priceRanges
    });
  } catch (error) {
    console.error('Price overlays controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

exports.getPopularAreas = async (req, res, next) => {
  try {
    const { city, limit = 10 } = req.query;
    
    if (!city) {
      return res.status(400).json({
        success: false,
        message: 'City is required'
      });
    }

    const result = await MapService.getPopularAreas(city, parseInt(limit));
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to get popular areas',
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Popular areas controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

exports.getMapSearchSuggestions = async (req, res, next) => {
  try {
    const { q, location } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const result = await MapService.getMapSearchSuggestions(q, location);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to get search suggestions',
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Map search suggestions controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

exports.searchThisArea = async (req, res, next) => {
  try {
    const { bounds, filters } = req.body;
    
    if (!bounds || !bounds.sw || !bounds.ne) {
      return res.status(400).json({
        success: false,
        message: 'Valid map bounds are required (southwest and northeast coordinates)'
      });
    }

    // Convert bounds to polygon for search
    const polygon = [
      [bounds.sw.lng, bounds.sw.lat],
      [bounds.ne.lng, bounds.sw.lat],
      [bounds.ne.lng, bounds.ne.lat],
      [bounds.sw.lng, bounds.ne.lat],
      [bounds.sw.lng, bounds.sw.lat]
    ];

    const result = await MapService.searchByPolygon(polygon, filters);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to search this area',
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.data,
      count: result.count,
      searchedArea: bounds
    });
  } catch (error) {
    console.error('Search this area controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
