const mongoose = require("mongoose");

const loyaltyTierSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    enum: ["Silver", "Gold", "Platinum", "Diamond"]
  },
  minPoints: { 
    type: Number, 
    required: true 
  },
  benefits: [{
    type: { 
      type: String, 
      enum: ["discount", "cashback", "free_night", "upgrade", "early_checkin", "late_checkout"]
    },
    value: { type: Number },
    description: { type: String }
  }],
  pointMultiplier: { 
    type: Number, 
    default: 1.0 
  },
  icon: { type: String },
  color: { type: String }
}, { _id: false });

const loyaltyTransactionSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  type: {
    type: String,
    enum: ["earned", "redeemed", "expired"],
    required: true
  },
  points: { 
    type: Number, 
    required: true 
  },
  source: {
    type: String,
    enum: ["booking", "review", "referral", "birthday", "promotion", "redemption"],
    required: true
  },
  description: { 
    type: String, 
    required: true 
  },
  referenceId: { 
    type: mongoose.Schema.Types.ObjectId 
  },
  referenceType: {
    type: String,
    enum: ["booking", "review", "referral", "promotion"]
  },
  expiresAt: { 
    type: Date 
  },
  metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

const loyaltyProgramSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true,
    unique: true 
  },
  currentPoints: { 
    type: Number, 
    default: 0,
    min: 0
  },
  totalEarnedPoints: { 
    type: Number, 
    default: 0 
  },
  totalRedeemedPoints: { 
    type: Number, 
    default: 0 
  },
  currentTier: {
    type: String,
    enum: ["Silver", "Gold", "Platinum", "Diamond"],
    default: "Silver"
  },
  tierHistory: [{
    tier: { type: String, required: true },
    achievedAt: { type: Date, default: Date.now },
    pointsAtAchievement: { type: Number, required: true }
  }],
  transactions: [loyaltyTransactionSchema],
  preferences: {
    notifications: { type: Boolean, default: true },
    autoRedeem: { type: Boolean, default: false },
    pointsExpiryReminder: { type: Boolean, default: true }
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  joinedAt: { 
    type: Date, 
    default: Date.now 
  },
  lastActivityAt: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

// Indexes are automatically created by unique: true and required fields

// Static method to get tier configurations
loyaltyProgramSchema.statics.getTierConfigs = function() {
  return [
    {
      name: "Silver",
      minPoints: 0,
      pointMultiplier: 1.0,
      benefits: [
        { type: "discount", value: 5, description: "5% off on bookings" },
        { type: "cashback", value: 2, description: "2% cashback to wallet" }
      ],
      icon: "medal",
      color: "#C0C0C0"
    },
    {
      name: "Gold",
      minPoints: 1000,
      pointMultiplier: 1.2,
      benefits: [
        { type: "discount", value: 10, description: "10% off on bookings" },
        { type: "cashback", value: 5, description: "5% cashback to wallet" },
        { type: "upgrade", description: "Free room upgrades when available" }
      ],
      icon: "trophy",
      color: "#FFD700"
    },
    {
      name: "Platinum",
      minPoints: 5000,
      pointMultiplier: 1.5,
      benefits: [
        { type: "discount", value: 15, description: "15% off on bookings" },
        { type: "cashback", value: 8, description: "8% cashback to wallet" },
        { type: "free_night", value: 5000, description: "Free night after 5000 points" },
        { type: "early_checkin", description: "Complimentary early check-in" },
        { type: "late_checkout", description: "Complimentary late checkout" }
      ],
      icon: "crown",
      color: "#E5E4E2"
    },
    {
      name: "Diamond",
      minPoints: 15000,
      pointMultiplier: 2.0,
      benefits: [
        { type: "discount", value: 20, description: "20% off on bookings" },
        { type: "cashback", value: 12, description: "12% cashback to wallet" },
        { type: "free_night", value: 3000, description: "Free night after 3000 points" },
        { type: "upgrade", description: "Guaranteed room upgrades" },
        { type: "early_checkin", description: "Guaranteed early check-in" },
        { type: "late_checkout", description: "Guaranteed late checkout" }
      ],
      icon: "gem",
      color: "#B9F2FF"
    }
  ];
};

// Method to add points
loyaltyProgramSchema.methods.addPoints = async function(points, source, description, referenceId = null, referenceType = null) {
  const tierConfigs = this.constructor.getTierConfigs();
  const currentTierConfig = tierConfigs.find(t => t.name === this.currentTier);
  const multiplier = currentTierConfig?.pointMultiplier || 1.0;
  
  const actualPoints = Math.round(points * multiplier);
  
  this.currentPoints += actualPoints;
  this.totalEarnedPoints += actualPoints;
  this.lastActivityAt = new Date();

  const transaction = {
    type: "earned",
    points: actualPoints,
    source,
    description: `${description} (${multiplier}x multiplier)`,
    referenceId,
    referenceType,
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // Points expire in 1 year
  };

  this.transactions.push(transaction);

  // Check for tier upgrade
  await this.checkTierUpgrade();

  await this.save();
  return transaction;
};

// Method to redeem points
loyaltyProgramSchema.methods.redeemPoints = async function(points, source, description) {
  if (this.currentPoints < points) {
    throw new Error('Insufficient loyalty points');
  }

  this.currentPoints -= points;
  this.totalRedeemedPoints += points;
  this.lastActivityAt = new Date();

  const transaction = {
    type: "redeemed",
    points,
    source,
    description
  };

  this.transactions.push(transaction);
  await this.save();
  return transaction;
};

// Method to check tier upgrade
loyaltyProgramSchema.methods.checkTierUpgrade = async function() {
  const tierConfigs = this.constructor.getTierConfigs();
  const newTier = tierConfigs
    .filter(t => t.minPoints <= this.currentPoints)
    .sort((a, b) => b.minPoints - a.minPoints)[0];

  if (newTier && newTier.name !== this.currentTier) {
    this.currentTier = newTier.name;
    this.tierHistory.push({
      tier: newTier.name,
      achievedAt: new Date(),
      pointsAtAchievement: this.currentPoints
    });
  }
};

// Method to get available rewards
loyaltyProgramSchema.methods.getAvailableRewards = function() {
  const tierConfigs = this.constructor.getTierConfigs();
  const currentTierConfig = tierConfigs.find(t => t.name === this.currentTier);
  return currentTierConfig?.benefits || [];
};

// Method to get expiring points
loyaltyProgramSchema.methods.getExpiringPoints = function(days = 30) {
  const expiryDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return this.transactions
    .filter(t => t.type === "earned" && t.expiresAt && t.expiresAt <= expiryDate)
    .reduce((sum, t) => sum + t.points, 0);
};

module.exports = mongoose.model("LoyaltyProgram", loyaltyProgramSchema);
