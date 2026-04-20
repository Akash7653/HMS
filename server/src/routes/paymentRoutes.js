const express = require("express");
const {
	getMyPayments,
	getPaymentConfig,
	createRazorpayOrder,
	verifyRazorpayPayment,
	recordFailedRazorpayPayment,
} = require("../controllers/paymentController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/config", getPaymentConfig);
router.get("/me", protect, getMyPayments);
router.post("/create-order", protect, createRazorpayOrder);
router.post("/verify", protect, verifyRazorpayPayment);
router.post("/fail", protect, recordFailedRazorpayPayment);

module.exports = router;
