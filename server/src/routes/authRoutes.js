const express = require("express");
const { register, login, me, updateProfile } = require("../controllers/authController");
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
router.get("/me", protect, me);
router.patch("/profile", protect, updateProfileValidator, validate, updateProfile);

module.exports = router;
