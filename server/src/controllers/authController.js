const User = require("../models/User");
const AuthService = require("../services/authService");
const OAuthService = require("../services/oauthService");
const { sendEmailSimulation } = require("../services/emailService");

function toUserPayload(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    city: user.city,
    country: user.country,
    role: user.role,
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified,
  };
}

function hashRefreshToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getRefreshExpiryDate() {
  const days = Number(process.env.JWT_REFRESH_EXPIRES_DAYS || 30);
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function getCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  };
}

async function issueAuthTokens(user, res) {
  const token = signToken(user);
  const refreshToken = signRefreshToken(user);

  user.refreshTokenHash = hashRefreshToken(refreshToken);
  user.refreshTokenExpiresAt = getRefreshExpiryDate();
  await user.save();

  res.cookie("hms_refresh_token", refreshToken, getCookieOptions());
  return token;
}

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone, city, country } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: "Email already in use" });

    const phoneExists = await User.findOne({ phone });
    if (phoneExists) return res.status(409).json({ message: "Phone already in use" });

    const user = await User.create({
      name,
      email,
      password,
      phone,
      city,
      country,
      emailVerified: true,
      phoneVerified: true,
    });

    await sendEmailSimulation({
      to: email,
      subject: "Welcome to Horizon-Hotels",
      html: `<p>Your account has been created successfully. You can sign in right away.</p>`,
    });

    const token = await issueAuthTokens(user, res);

    res.status(201).json({
      message: "Account created successfully.",
      token,
      user: toUserPayload(user),
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;

    const isEmail = String(identifier).includes("@");
    const query = isEmail ? { email: identifier.toLowerCase() } : { phone: String(identifier).replace(/\D/g, "") };

    const user = await User.findOne(query).select("+password");
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = await issueAuthTokens(user, res);

    res.json({
      token,
      user: toUserPayload(user),
    });
  } catch (error) {
    next(error);
  }
};

exports.me = async (req, res) => {
  res.json({ user: req.user });
};

exports.refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.hms_refresh_token;
    if (!refreshToken) return res.status(401).json({ message: "Refresh token missing" });

    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.id).select("+refreshTokenHash +refreshTokenExpiresAt");

    if (!user || !user.refreshTokenHash) {
      return res.status(401).json({ message: "Invalid refresh session" });
    }

    const providedHash = hashRefreshToken(refreshToken);
    if (providedHash !== user.refreshTokenHash) {
      return res.status(401).json({ message: "Refresh token mismatch" });
    }

    if (!user.refreshTokenExpiresAt || user.refreshTokenExpiresAt < new Date()) {
      return res.status(401).json({ message: "Refresh token expired" });
    }

    const token = await issueAuthTokens(user, res);
    res.json({ token, user: toUserPayload(user) });
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("+refreshTokenHash +refreshTokenExpiresAt");
    if (user) {
      user.refreshTokenHash = "";
      user.refreshTokenExpiresAt = null;
      await user.save();
    }

    res.clearCookie("hms_refresh_token", getCookieOptions());
    res.json({ message: "Logged out" });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, email, phone, city, country } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ message: "User not found" });

    if (email && email !== user.email) {
      const emailTaken = await User.findOne({ email, _id: { $ne: user._id } });
      if (emailTaken) return res.status(409).json({ message: "Email already in use" });
      user.email = email;
    }

    if (phone && phone !== user.phone) {
      const phoneTaken = await User.findOne({ phone, _id: { $ne: user._id } });
      if (phoneTaken) return res.status(409).json({ message: "Phone already in use" });
      user.phone = phone;
    }

    if (typeof name === "string") user.name = name;
    if (typeof city === "string") user.city = city;
    if (typeof country === "string") user.country = country;

    await user.save();

    res.json({
      message: "Profile updated",
      user: toUserPayload(user),
    });
  } catch (error) {
    next(error);
  }
};

// OAuth endpoints
exports.getGoogleAuthURL = async (req, res, next) => {
  try {
    const authURL = await OAuthService.getGoogleAuthURL();
    res.json({
      success: true,
      authURL
    });
  } catch (error) {
    next(error);
  }
};

exports.getFacebookAuthURL = async (req, res, next) => {
  try {
    const authURL = await OAuthService.getFacebookAuthURL();
    res.json({
      success: true,
      authURL
    });
  } catch (error) {
    next(error);
  }
};

exports.handleGoogleCallback = async (req, res, next) => {
  try {
    const { code, state } = req.body;
    const deviceInfo = AuthService.extractDeviceInfo(req);
    
    const result = await OAuthService.handleGoogleCallback(code, state, deviceInfo);
    
    res.json({
      success: true,
      message: "OAuth authentication successful",
      ...result
    });
  } catch (error) {
    next(error);
  }
};

exports.handleFacebookCallback = async (req, res, next) => {
  try {
    const { code, state } = req.body;
    const deviceInfo = AuthService.extractDeviceInfo(req);
    
    const result = await OAuthService.handleFacebookCallback(code, state, deviceInfo);
    
    res.json({
      success: true,
      message: "OAuth authentication successful",
      ...result
    });
  } catch (error) {
    next(error);
  }
};

// Enhanced token management
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is required"
      });
    }

    const result = await AuthService.refreshAccessToken(refreshToken);
    
    res.json({
      success: true,
      message: "Token refreshed successfully",
      ...result
    });
  } catch (error) {
    next(error);
  }
};

// Session management
exports.getActiveSessions = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const sessions = await AuthService.getActiveSessions(userId);
    
    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    next(error);
  }
};

exports.revokeSession = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { sessionId } = req.params;
    
    await AuthService.revokeSession(userId, sessionId);
    
    res.json({
      success: true,
      message: "Session revoked successfully"
    });
  } catch (error) {
    next(error);
  }
};

exports.revokeAllSessions = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    await AuthService.revokeAllUserTokens(userId);
    
    res.json({
      success: true,
      message: "All sessions revoked successfully"
    });
  } catch (error) {
    next(error);
  }
};

// Enhanced logout
exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    
    await AuthService.logout(accessToken, refreshToken);
    
    res.json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    next(error);
  }
};

