const Razorpay = require("razorpay");
const crypto = require("crypto");

// Lazy-initialize Razorpay instance
let razorpay = null;

function getRazorpay() {
  if (!razorpay && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpay;
}

/**
 * Create a Razorpay order
 * @param {number} amount - Amount in paise (multiply by 100 from INR)
 * @param {string} currency - Currency code (default: INR)
 * @param {string} notes - Additional notes
 * @returns {Object} Order object with id, amount, currency
 */
exports.createOrder = async (amount, currency = "INR", notes = {}) => {
  try {
    const client = getRazorpay();
    if (!client) {
      throw new Error("Razorpay not configured");
    }

    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      notes,
    };

    const order = await client.orders.create(options);
    return order;
  } catch (error) {
    console.error("Razorpay order creation failed:", error);
    throw new Error(`Failed to create Razorpay order: ${error.message}`);
  }
};

/**
 * Verify Razorpay payment signature (HMAC SHA256)
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} signature - Signature from frontend
 * @returns {boolean} True if signature is valid
 */
exports.verifySignature = (orderId, paymentId, signature) => {
  try {
    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    return expectedSignature === signature;
  } catch (error) {
    console.error("Signature verification failed:", error);
    return false;
  }
};

/**
 * Fetch payment details from Razorpay
 * @param {string} paymentId - Razorpay payment ID
 * @returns {Object} Payment details
 */
exports.fetchPayment = async (paymentId) => {
  try {
    const client = getRazorpay();
    if (!client) {
      throw new Error("Razorpay not configured");
    }

    const payment = await client.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    console.error("Razorpay payment fetch failed:", error);
    throw error;
  }
};

/**
 * Refund a payment
 * @param {string} paymentId - Razorpay payment ID
 * @param {number} amount - Amount to refund in INR (optional)
 * @returns {Object} Refund details
 */
exports.refundPayment = async (paymentId, amount = null) => {
  try {
    const client = getRazorpay();
    if (!client) {
      throw new Error("Razorpay not configured");
    }

    const options = {
      notes: {
        refund_reason: "Booking cancelled",
      },
    };

    if (amount) {
      options.amount = Math.round(amount * 100); // Convert to paise
    }

    const refund = await client.payments.refund(paymentId, options);
    return refund;
  } catch (error) {
    console.error("Razorpay refund failed:", error);
    throw error;
  }
};

/**
 * Check if Razorpay is properly configured
 * @returns {boolean} True if configured
 */
exports.isConfigured = () => {
  return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
};
