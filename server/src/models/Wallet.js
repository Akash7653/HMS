const mongoose = require("mongoose");

const walletTransactionSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  type: {
    type: String,
    enum: ["credit", "debit"],
    required: true
  },
  amount: { 
    type: Number, 
    required: true,
    min: 0
  },
  source: {
    type: String,
    enum: ["refund", "cashback", "booking_payment", "wallet_topup", "penalty", "bonus"],
    required: true
  },
  description: { 
    type: String, 
    required: true 
  },
  referenceId: { 
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  referenceType: {
    type: String,
    enum: ["booking", "commission", "promotion"],
    required: false
  },
  balance: { 
    type: Number, 
    required: true 
  }, // Balance after this transaction
  status: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "completed"
  },
  metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

const walletSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true,
    unique: true 
  },
  balance: { 
    type: Number, 
    default: 0,
    min: 0
  },
  totalCredits: { 
    type: Number, 
    default: 0 
  },
  totalDebits: { 
    type: Number, 
    default: 0 
  },
  lastTransactionAt: { 
    type: Date 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  transactions: [walletTransactionSchema]
}, { timestamps: true });

// Indexes are automatically created by unique: true and required fields

// Method to add transaction
walletSchema.methods.addTransaction = async function(transactionData) {
  const transaction = {
    ...transactionData,
    balance: this.balance + (transactionData.type === 'credit' ? transactionData.amount : -transactionData.amount)
  };

  // Update wallet balance
  if (transactionData.type === 'credit') {
    this.balance += transactionData.amount;
    this.totalCredits += transactionData.amount;
  } else {
    if (this.balance < transactionData.amount) {
      throw new Error('Insufficient wallet balance');
    }
    this.balance -= transactionData.amount;
    this.totalDebits += transactionData.amount;
  }

  this.lastTransactionAt = new Date();
  this.transactions.push(transaction);

  await this.save();
  return transaction;
};

// Method to get transaction history
walletSchema.methods.getTransactionHistory = function(page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  return this.transactions
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

module.exports = mongoose.model("Wallet", walletSchema);
