const Joi = require('joi');
const { body, param, query, validationResult } = require('express-validator');

// Common validation schemas
const schemas = {
  // User validation schemas
  register: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^[0-9]{10}$/).required(),
    password: Joi.string().min(6).max(128).required(),
    city: Joi.string().max(50),
    country: Joi.string().max(50)
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  // Hotel validation schemas
  hotelSearch: Joi.object({
    city: Joi.string().max(50),
    state: Joi.string().max(50),
    checkIn: Joi.date().iso(),
    checkOut: Joi.date().iso().greater(Joi.ref('checkIn')),
    guests: Joi.number().integer().min(1).max(10),
    roomType: Joi.string().valid('Single', 'Double', 'Suite'),
    minPrice: Joi.number().min(0),
    maxPrice: Joi.number().min(Joi.ref('minPrice')),
    rating: Joi.number().min(0).max(5),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10),
    sort: Joi.string().valid('price', 'rating', 'distance', 'popularity').default('popularity'),
    order: Joi.string().valid('asc', 'desc').default('desc')
  }),

  // Booking validation schemas
  createBooking: Joi.object({
    hotel: Joi.string().hex().length(24).required(),
    roomType: Joi.string().valid('Single', 'Double', 'Suite').required(),
    checkIn: Joi.date().iso().required(),
    checkOut: Joi.date().iso().greater(Joi.ref('checkIn')).required(),
    guests: Joi.number().integer().min(1).max(10).required(),
    paymentMethod: Joi.string().valid('stripe', 'razorpay', 'wallet').required(),
    addOns: Joi.array().items(Joi.object({
      type: Joi.string().required(),
      price: Joi.number().min(0).required()
    }))
  }),

  // Review validation schemas
  createReview: Joi.object({
    hotel: Joi.string().hex().length(24).required(),
    rating: Joi.number().integer().min(1).max(5).required(),
    title: Joi.string().min(1).max(100).required(),
    content: Joi.string().min(10).max(1000).required(),
    images: Joi.array().items(Joi.string().uri()).max(5)
  }),

  // Payment validation schemas
  processPayment: Joi.object({
    bookingId: Joi.string().hex().length(24).required(),
    paymentMethod: Joi.string().valid('card', 'upi', 'netbanking', 'wallet').required(),
    paymentDetails: Joi.object().when('paymentMethod', {
      is: 'card',
      then: Joi.object({
        cardNumber: Joi.string().pattern(/^[0-9]{16}$/).required(),
        expiryMonth: Joi.number().integer().min(1).max(12).required(),
        expiryYear: Joi.number().integer().min(new Date().getFullYear()).required(),
        cvv: Joi.string().pattern(/^[0-9]{3,4}$/).required(),
        cardholderName: Joi.string().min(1).max(100).required()
      }).required(),
      otherwise: Joi.when('paymentMethod', {
        is: 'upi',
        then: Joi.object({
          upiId: Joi.string().pattern(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/).required()
        }).required(),
        otherwise: Joi.when('paymentMethod', {
          is: 'netbanking',
          then: Joi.object({
            bankCode: Joi.string().required(),
            accountNumber: Joi.string().pattern(/^[0-9]{9,18}$/).required(),
            ifsc: Joi.string().pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/).required()
          }).required()
        })
      })
    }),
    amount: Joi.number().min(1).required(),
    savePaymentMethod: Joi.boolean().default(false)
  }),

  // Analytics validation schemas
  trackEvent: Joi.object({
    eventType: Joi.string().valid('click', 'search', 'filter', 'booking', 'wishlist', 'review', 'payment', 'login', 'signup').required(),
    eventData: Joi.object().required(),
    page: Joi.string().uri(),
    sessionId: Joi.string().required()
  }),

  // Map validation schemas
  polygonSearch: Joi.object({
    polygon: Joi.array().items(
      Joi.array().items(Joi.number().min(-180).max(180), Joi.number().min(-90).max(90)).length(2)
    ).min(3).required(),
    filters: Joi.object({
      minPrice: Joi.number().min(0),
      maxPrice: Joi.number().min(Joi.ref('minPrice')),
      rating: Joi.number().min(0).max(5),
      amenities: Joi.array().items(Joi.string())
    })
  }),

  // Business validation schemas
  vendorRegistration: Joi.object({
    businessName: Joi.string().min(2).max(100).required(),
    businessType: Joi.string().valid('individual', 'company', 'chain').required(),
    registrationNumber: Joi.string().max(50),
    taxId: Joi.string().max(50),
    contactInfo: Joi.object({
      phone: Joi.string().pattern(/^[0-9]{10}$/).required(),
      email: Joi.string().email().required(),
      address: Joi.string().min(5).max(200).required()
    }).required(),
    bankDetails: Joi.object({
      accountNumber: Joi.string().pattern(/^[0-9]{9,18}$/).required(),
      bankName: Joi.string().min(2).max(100).required(),
      ifscCode: Joi.string().pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/).required(),
      accountHolderName: Joi.string().min(2).max(100).required()
    }).required()
  })
};

// Validation middleware factory
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = source === 'body' ? req.body : 
                source === 'query' ? req.query : 
                source === 'params' ? req.params : req.body;

    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context.value
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    // Replace the original data with validated and cleaned data
    if (source === 'body') req.body = value;
    else if (source === 'query') req.query = value;
    else if (source === 'params') req.params = value;

    next();
  };
};

// Express-validator based validation for complex cases
const validateBooking = [
  body('hotel').isMongoId().withMessage('Invalid hotel ID'),
  body('roomType').isIn(['Single', 'Double', 'Suite']).withMessage('Invalid room type'),
  body('checkIn').isISO8601().withMessage('Invalid check-in date'),
  body('checkOut').isISO8601().custom((value, { req }) => {
    if (new Date(value) <= new Date(req.body.checkIn)) {
      throw new Error('Check-out date must be after check-in date');
    }
    return true;
  }),
  body('guests').isInt({ min: 1, max: 10 }).withMessage('Guests must be between 1 and 10'),
  body('paymentMethod').isIn(['stripe', 'razorpay', 'wallet']).withMessage('Invalid payment method'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

const validateReview = [
  body('hotel').isMongoId().withMessage('Invalid hotel ID'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('title').isLength({ min: 1, max: 100 }).withMessage('Title must be 1-100 characters'),
  body('content').isLength({ min: 10, max: 1000 }).withMessage('Review must be 10-1000 characters'),
  body('images').optional().isArray({ max: 5 }).withMessage('Maximum 5 images allowed'),
  body('images.*').optional().isURL().withMessage('Invalid image URL'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

const validatePayment = [
  body('bookingId').isMongoId().withMessage('Invalid booking ID'),
  body('paymentMethod').isIn(['card', 'upi', 'netbanking', 'wallet']).withMessage('Invalid payment method'),
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be greater than 0'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

// Custom validation middleware
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`
      });
    }
    
    next();
  };
};

const validateDateRange = (checkInField = 'checkIn', checkOutField = 'checkOut') => {
  return (req, res, next) => {
    const checkIn = req.query[checkInField] || req.body[checkInField];
    const checkOut = req.query[checkOutField] || req.body[checkOutField];
    
    if (checkIn && checkOut) {
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      
      if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format'
        });
      }
      
      if (checkInDate >= checkOutDate) {
        return res.status(400).json({
          success: false,
          message: 'Check-out date must be after check-in date'
        });
      }
      
      if (checkInDate < new Date().setHours(0, 0, 0, 0)) {
        return res.status(400).json({
          success: false,
          message: 'Check-in date cannot be in the past'
        });
      }
    }
    
    next();
  };
};

const validatePagination = (defaultLimit = 10, maxLimit = 50) => {
  return (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || defaultLimit;
    
    if (page < 1) {
      return res.status(400).json({
        success: false,
        message: 'Page must be greater than 0'
      });
    }
    
    if (limit < 1 || limit > maxLimit) {
      return res.status(400).json({
        success: false,
        message: `Limit must be between 1 and ${maxLimit}`
      });
    }
    
    req.query.page = page;
    req.query.limit = limit;
    
    next();
  };
};

// Security validation middleware
const validateFileUpload = (maxSize = 5 * 1024 * 1024, allowedTypes = ['image/jpeg', 'image/png', 'image/webp']) => {
  return (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: `File size must be less than ${maxSize / 1024 / 1024}MB`
      });
    }
    
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
      });
    }
    
    next();
  };
};

const sanitizeInput = (req, res, next) => {
  // Sanitize common input fields to prevent XSS
  const sanitize = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        // Basic XSS prevention
        sanitized[key] = value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      } else if (typeof value === 'object') {
        sanitized[key] = sanitize(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  };
  
  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  
  next();
};

module.exports = {
  schemas,
  validate,
  validateBooking,
  validateReview,
  validatePayment,
  validateObjectId,
  validateDateRange,
  validatePagination,
  validateFileUpload,
  sanitizeInput
};
