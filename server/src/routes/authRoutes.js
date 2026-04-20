const express = require("express");
const { register, login, me, verifyContact, resendOtp, updateProfile } = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");
const {
	registerValidator,
	loginValidator,
	verifyContactValidator,
	resendOtpValidator,
	updateProfileValidator,
} = require("../validators/authValidators");

const router = express.Router();

router.post("/register", registerValidator, validate, register);
router.post("/login", loginValidator, validate, login);
router.post("/verify-contact", verifyContactValidator, validate, verifyContact);
router.post("/resend-otp", resendOtpValidator, validate, resendOtp);
router.get("/me", protect, me);
router.patch("/profile", protect, updateProfileValidator, validate, updateProfile);

module.exports = router;
