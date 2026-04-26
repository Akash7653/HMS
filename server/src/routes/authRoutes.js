const express = require("express");
const { 
  register, 
  login, 
  me, 
  updateProfile, 
  refresh, 
  logout,
  getGoogleAuthURL,
  getFacebookAuthURL,
  handleGoogleCallback,
  handleFacebookCallback,
  getActiveSessions,
  revokeSession,
  revokeAllSessions
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { validate, schemas } = require("../middleware/apiValidation");
const {
  registerValidator,
  loginValidator,
  updateProfileValidator,
} = require("../validators/authValidators");

const { validationResult } = require("express-validator");

const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  }
  next();
};

const router = express.Router();

// Basic auth endpoints
router.post("/register", registerValidator, checkValidation, register);
router.post("/login", loginValidator, checkValidation, login);
router.post("/refresh", refresh);
router.post("/logout", protect, logout);
router.get("/me", protect, me);
router.patch("/profile", protect, updateProfileValidator, checkValidation, updateProfile);

// OAuth endpoints
router.get("/oauth/google", getGoogleAuthURL);
router.get("/oauth/facebook", getFacebookAuthURL);
router.post("/oauth/google/callback", handleGoogleCallback);
router.post("/oauth/facebook/callback", handleFacebookCallback);

// Session management endpoints
router.get("/sessions", protect, getActiveSessions);
router.delete("/sessions/:sessionId", protect, revokeSession);
router.delete("/sessions", protect, revokeAllSessions);

module.exports = router;
