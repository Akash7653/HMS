const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  registerVendor,
  getVendorProfile,
  updateVendorProfile,
  getVendorCommissions,
  getCommissionSummary,
  getWallet,
  getWalletTransactions,
  topupWallet,
  getLoyaltyProgram,
  getLoyaltyTransactions,
  getDynamicPrice,
  getPricingTrends,
  calculateCommission,
  addLoyaltyPoints,
  processWalletRefund
} = require("../controllers/businessController");
const { cache } = require("../middleware/cacheMiddleware");

const router = express.Router();

// All business routes require authentication
router.use(protect);

// Vendor routes
router.post("/vendor/register", registerVendor);
router.get("/vendor/profile", getVendorProfile);
router.put("/vendor/profile", updateVendorProfile);
router.get("/vendor/commissions", getVendorCommissions);
router.get("/vendor/commissions/summary", getCommissionSummary);

// Wallet routes
router.get("/wallet", getWallet);
router.get("/wallet/transactions", getWalletTransactions);
router.post("/wallet/topup", topupWallet);

// Loyalty program routes
router.get("/loyalty", getLoyaltyProgram);
router.get("/loyalty/transactions", getLoyaltyTransactions);

// Dynamic pricing routes (public)
router.get("/pricing/dynamic", cache(300), getDynamicPrice);
router.get("/pricing/trends", cache(900), getPricingTrends);

module.exports = router;
