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

const router = express.Router();

// Basic auth endpoints
router.post("/register", registerValidator, validate, register);
router.post("/login", loginValidator, validate, login);
router.post("/refresh", validate(schemas.login), refresh);
router.post("/logout", protect, logout);
router.get("/me", protect, me);
router.patch("/profile", protect, updateProfileValidator, validate, updateProfile);

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
