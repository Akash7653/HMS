const Vendor = require("../models/Vendor");
const Commission = require("../models/Commission");
const Wallet = require("../models/Wallet");
const LoyaltyProgram = require("../models/LoyaltyProgram");
const DynamicPricingService = require("../services/dynamicPricingService");
const Booking = require("../models/Booking");
const Hotel = require("../models/Hotel");

// Vendor Management
exports.registerVendor = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const vendorData = req.body;

    // Check if user is already a vendor
    const existingVendor = await Vendor.findOne({ user: userId });
    if (existingVendor) {
      return res.status(400).json({
        success: false,
        message: "User is already registered as a vendor"
      });
    }

    const vendor = new Vendor({
      ...vendorData,
      user: userId
    });

    await vendor.save();

    res.status(201).json({
      success: true,
      message: "Vendor registration successful",
      data: vendor
    });
  } catch (error) {
    console.error('Vendor registration error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to register vendor"
    });
  }
};

exports.getVendorProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const vendor = await Vendor.findOne({ user: userId })
      .populate('user', 'name email phone');

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor profile not found"
      });
    }

    res.json({
      success: true,
      data: vendor
    });
  } catch (error) {
    console.error('Get vendor profile error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to get vendor profile"
    });
  }
};

exports.updateVendorProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    const vendor = await Vendor.findOneAndUpdate(
      { user: userId },
      updates,
      { new: true, runValidators: true }
    );

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor profile not found"
      });
    }

    res.json({
      success: true,
      message: "Vendor profile updated successfully",
      data: vendor
    });
  } catch (error) {
    console.error('Update vendor profile error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to update vendor profile"
    });
  }
};

// Commission Management
exports.getVendorCommissions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const vendor = await Vendor.findOne({ user: userId });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor profile not found"
      });
    }

    const { page = 1, limit = 20, status } = req.query;
    const query = { vendor: vendor._id };
    
    if (status) {
      query.status = status;
    }

    const commissions = await Commission.find(query)
      .populate('booking', 'totalPrice createdAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Commission.countDocuments(query);

    res.json({
      success: true,
      data: commissions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get vendor commissions error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to get commissions"
    });
  }
};

exports.getCommissionSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const vendor = await Vendor.findOne({ user: userId });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor profile not found"
      });
    }

    const summary = await Commission.aggregate([
      { $match: { vendor: vendor._id } },
      {
        $group: {
          _id: null,
          totalCommission: { $sum: "$commissionAmount" },
          pendingAmount: {
            $sum: {
              $cond: [{ $eq: ["$status", "pending"] }, "$commissionAmount", 0]
            }
          },
          availableAmount: {
            $sum: {
              $cond: [{ $eq: ["$status", "available"] }, "$commissionAmount", 0]
            }
          },
          paidAmount: {
            $sum: {
              $cond: [{ $eq: ["$status", "paid"] }, "$commissionAmount", 0]
            }
          },
          totalBookings: { $sum: 1 }
        }
      }
    ]);

    const result = summary[0] || {
      totalCommission: 0,
      pendingAmount: 0,
      availableAmount: 0,
      paidAmount: 0,
      totalBookings: 0
    };

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get commission summary error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to get commission summary"
    });
  }
};

// Wallet Management
exports.getWallet = async (req, res, next) => {
  try {
    const userId = req.user.id;
    let wallet = await Wallet.findOne({ user: userId });

    if (!wallet) {
      wallet = new Wallet({ user: userId });
      await wallet.save();
    }

    res.json({
      success: true,
      data: wallet
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to get wallet"
    });
  }
};

exports.getWalletTransactions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, type } = req.query;

    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found"
      });
    }

    let transactions = wallet.getTransactionHistory(parseInt(page), parseInt(limit));
    
    if (type) {
      transactions = transactions.filter(t => t.type === type);
    }

    res.json({
      success: true,
      data: transactions,
      balance: wallet.balance
    });
  } catch (error) {
    console.error('Get wallet transactions error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to get wallet transactions"
    });
  }
};

exports.topupWallet = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { amount, paymentMethod } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount"
      });
    }

    let wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      wallet = new Wallet({ user: userId });
    }

    const transaction = await wallet.addTransaction({
      type: "credit",
      amount,
      source: "wallet_topup",
      description: `Wallet top-up via ${paymentMethod}`,
      metadata: { paymentMethod }
    });

    res.json({
      success: true,
      message: "Wallet topped up successfully",
      data: {
        transaction,
        newBalance: wallet.balance
      }
    });
  } catch (error) {
    console.error('Wallet topup error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to top up wallet"
    });
  }
};

// Loyalty Program Management
exports.getLoyaltyProgram = async (req, res, next) => {
  try {
    const userId = req.user.id;
    let loyaltyProgram = await LoyaltyProgram.findOne({ user: userId });

    if (!loyaltyProgram) {
      loyaltyProgram = new LoyaltyProgram({ user: userId });
      await loyaltyProgram.save();
    }

    const tierConfigs = LoyaltyProgram.getTierConfigs();
    const currentTierConfig = tierConfigs.find(t => t.name === loyaltyProgram.currentTier);
    const nextTierConfig = tierConfigs.find(t => t.minPoints > loyaltyProgram.currentPoints);

    res.json({
      success: true,
      data: {
        ...loyaltyProgram.toObject(),
        currentTierConfig,
        nextTierConfig,
        pointsToNextTier: nextTierConfig ? nextTierConfig.minPoints - loyaltyProgram.currentPoints : 0
      }
    });
  } catch (error) {
    console.error('Get loyalty program error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to get loyalty program"
    });
  }
};

exports.getLoyaltyTransactions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, type } = req.query;

    const loyaltyProgram = await LoyaltyProgram.findOne({ user: userId });
    if (!loyaltyProgram) {
      return res.status(404).json({
        success: false,
        message: "Loyalty program not found"
      });
    }

    let transactions = loyaltyProgram.transactions
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    if (type) {
      transactions = transactions.filter(t => t.type === type);
    }

    res.json({
      success: true,
      data: transactions,
      currentPoints: loyaltyProgram.currentPoints,
      currentTier: loyaltyProgram.currentTier
    });
  } catch (error) {
    console.error('Get loyalty transactions error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to get loyalty transactions"
    });
  }
};

// Dynamic Pricing
exports.getDynamicPrice = async (req, res, next) => {
  try {
    const { hotelId, roomType, checkIn, checkOut } = req.query;

    if (!hotelId || !roomType || !checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters"
      });
    }

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found"
      });
    }

    const roomTypeInfo = hotel.roomTypes.find(rt => rt.type === roomType);
    if (!roomTypeInfo) {
      return res.status(404).json({
        success: false,
        message: "Room type not found"
      });
    }

    const pricingResult = await DynamicPricingService.calculateDynamicPrice(
      hotelId,
      roomType,
      new Date(checkIn),
      new Date(checkOut),
      roomTypeInfo.basePrice
    );

    res.json({
      success: true,
      data: pricingResult
    });
  } catch (error) {
    console.error('Get dynamic price error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to calculate dynamic price"
    });
  }
};

exports.getPricingTrends = async (req, res, next) => {
  try {
    const { hotelId, roomType, days = 30 } = req.query;

    if (!hotelId || !roomType) {
      return res.status(400).json({
        success: false,
        message: "Hotel ID and room type are required"
      });
    }

    const trends = await DynamicPricingService.getPricingTrends(
      hotelId,
      roomType,
      parseInt(days)
    );

    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error('Get pricing trends error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to get pricing trends"
    });
  }
};

// Middleware to calculate and record commissions
exports.calculateCommission = async (booking) => {
  try {
    // Find vendor for this hotel
    const hotel = await Hotel.findById(booking.hotel);
    const vendor = await Vendor.findOne({ user: hotel.owner });

    if (!vendor) {
      console.log('No vendor found for hotel:', booking.hotel);
      return;
    }

    const commissionAmount = booking.totalPrice * vendor.commissionSettings.commissionRate;
    const holdUntil = new Date(Date.now() + vendor.commissionSettings.holdPeriod * 24 * 60 * 60 * 1000);

    const commission = new Commission({
      vendor: vendor._id,
      booking: booking._id,
      commissionAmount,
      commissionRate: vendor.commissionSettings.commissionRate,
      bookingAmount: booking.totalPrice,
      status: 'pending',
      holdUntil
    });

    await commission.save();
    console.log('Commission calculated for booking:', booking._id);
  } catch (error) {
    console.error('Error calculating commission:', error);
  }
};

// Middleware to add loyalty points for booking
exports.addLoyaltyPoints = async (booking) => {
  try {
    let loyaltyProgram = await LoyaltyProgram.findOne({ user: booking.user });
    if (!loyaltyProgram) {
      loyaltyProgram = new LoyaltyProgram({ user: booking.user });
    }

    // Calculate points (1 point per Rs. 10 spent)
    const points = Math.floor(booking.totalPrice / 10);
    
    await loyaltyProgram.addPoints(
      points,
      'booking',
      `Points earned for booking at ${booking.hotel}`,
      booking._id,
      'booking'
    );

    console.log(`Added ${points} loyalty points for booking: ${booking._id}`);
  } catch (error) {
    console.error('Error adding loyalty points:', error);
  }
};

// Middleware to process wallet refunds
exports.processWalletRefund = async (booking, refundAmount) => {
  try {
    let wallet = await Wallet.findOne({ user: booking.user });
    if (!wallet) {
      wallet = new Wallet({ user: booking.user });
    }

    await wallet.addTransaction({
      type: "credit",
      amount: refundAmount,
      source: "refund",
      description: `Refund for cancelled booking ${booking._id}`,
      referenceId: booking._id,
      referenceType: "booking"
    });

    console.log(`Processed wallet refund of ${refundAmount} for booking: ${booking._id}`);
  } catch (error) {
    console.error('Error processing wallet refund:', error);
  }
};
