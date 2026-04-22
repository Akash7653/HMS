const express = require("express");
const { register, login, me, updateProfile, refresh, logout } = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");
const {
	registerValidator,
	loginValidator,
	updateProfileValidator,
} = require("../validators/authValidators");

const router = express.Router();

router.post("/register", registerValidator, validate, register);
router.post("/login", loginValidator, validate, login);
router.post("/refresh", refresh);
router.post("/logout", protect, logout);
router.get("/me", protect, me);
router.patch("/profile", protect, updateProfileValidator, validate, updateProfile);

module.exports = router;
