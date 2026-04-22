const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const redisService = require("./redisService");

class AuthService {
  static generateTokens(user) {
    const accessToken = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: process.env.JWT_EXPIRE || '15m',
        issuer: 'horizon-hotels',
        audience: 'horizon-hotels-users'
      }
    );

    const refreshToken = this.generateRefreshToken();

    return { accessToken, refreshToken };
  }

  static generateRefreshToken() {
    return crypto.randomBytes(40).toString('hex');
  }

  static async createRefreshToken(user, deviceInfo = {}) {
    try {
      const refreshToken = this.generateRefreshToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const tokenDoc = new RefreshToken({
        user: user._id,
        token: refreshToken,
        deviceInfo,
        expiresAt
      });

      await tokenDoc.save();
      return refreshToken;
    } catch (error) {
      console.error('Error creating refresh token:', error);
      throw error;
    }
  }

  static async verifyRefreshToken(token) {
    try {
      const tokenDoc = await RefreshToken.findOne({
        token,
        isActive: true,
        expiresAt: { $gt: new Date() }
      }).populate('user');

      if (!tokenDoc) {
        throw new Error('Invalid or expired refresh token');
      }

      // Update last used timestamp
      tokenDoc.lastUsedAt = new Date();
      await tokenDoc.save();

      return tokenDoc.user;
    } catch (error) {
      console.error('Error verifying refresh token:', error);
      throw error;
    }
  }

  static async revokeRefreshToken(token, reason = 'logout') {
    try {
      const tokenDoc = await RefreshToken.findOne({ token });
      if (tokenDoc) {
        tokenDoc.isActive = false;
        tokenDoc.revokedAt = new Date();
        tokenDoc.revokeReason = reason;
        await tokenDoc.save();
      }
    } catch (error) {
      console.error('Error revoking refresh token:', error);
      throw error;
    }
  }

  static async revokeAllUserTokens(userId) {
    try {
      await RefreshToken.updateMany(
        { user: userId, isActive: true },
        { 
          isActive: false, 
          revokedAt: new Date(), 
          revokeReason: 'security_breach' 
        }
      );
    } catch (error) {
      console.error('Error revoking all user tokens:', error);
      throw error;
    }
  }

  static async refreshAccessToken(refreshToken) {
    try {
      const user = await this.verifyRefreshToken(refreshToken);
      const tokens = this.generateTokens(user);

      // Cache the new access token for faster validation
      await redisService.setSession(tokens.accessToken, {
        userId: user._id,
        role: user.role,
        createdAt: new Date()
      }, 900); // 15 minutes

      return {
        accessToken: tokens.accessToken,
        refreshToken: refreshToken, // Keep the same refresh token
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      };
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw error;
    }
  }

  static async validateAccessToken(token) {
    try {
      // First check Redis cache for faster validation
      const cachedSession = await redisService.getSession(token);
      if (cachedSession) {
        return cachedSession;
      }

      // If not in cache, verify JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Cache the validated token
      await redisService.setSession(token, {
        userId: decoded.id,
        role: decoded.role,
        createdAt: new Date()
      }, 900);

      return decoded;
    } catch (error) {
      console.error('Error validating access token:', error);
      
      // Remove from cache if invalid
      await redisService.deleteSession(token);
      
      throw error;
    }
  }

  static async login(email, password, deviceInfo = {}) {
    try {
      // Find user and include password for verification
      const user = await User.findOne({ email }).select('+password');
      
      if (!user || !(await user.comparePassword(password))) {
        throw new Error('Invalid credentials');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      // Generate tokens
      const tokens = this.generateTokens(user);
      
      // Create refresh token
      await this.createRefreshToken(user, deviceInfo);

      // Track login event
      await redisService.trackEvent('user_login', {
        userId: user._id,
        device: deviceInfo.device,
        ip: deviceInfo.ip
      });

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar
        }
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  static async logout(accessToken, refreshToken) {
    try {
      // Revoke refresh token
      if (refreshToken) {
        await this.revokeRefreshToken(refreshToken, 'logout');
      }

      // Remove access token from cache
      if (accessToken) {
        await redisService.deleteSession(accessToken);
      }

      // Track logout event
      await redisService.trackEvent('user_logout', {});

      return true;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  static async getActiveSessions(userId) {
    try {
      const tokens = await RefreshToken.find({
        user: userId,
        isActive: true,
        expiresAt: { $gt: new Date() }
      }).sort({ lastUsedAt: -1 });

      return tokens.map(token => ({
        id: token._id,
        device: token.deviceInfo.device || 'Unknown',
        browser: token.deviceInfo.browser || 'Unknown',
        os: token.deviceInfo.os || 'Unknown',
        ip: token.deviceInfo.ip || 'Unknown',
        lastUsedAt: token.lastUsedAt,
        createdAt: token.createdAt
      }));
    } catch (error) {
      console.error('Error getting active sessions:', error);
      throw error;
    }
  }

  static async revokeSession(userId, sessionId) {
    try {
      await RefreshToken.updateOne(
        { _id: sessionId, user: userId },
        { 
          isActive: false, 
          revokedAt: new Date(), 
          revokeReason: 'user_initiated' 
        }
      );
      return true;
    } catch (error) {
      console.error('Error revoking session:', error);
      throw error;
    }
  }

  static async cleanupExpiredTokens() {
    try {
      const result = await RefreshToken.deleteMany({
        expiresAt: { $lt: new Date() }
      });

      console.log(`Cleaned up ${result.deletedCount} expired refresh tokens`);
      return result.deletedCount;
    } catch (error) {
      console.error('Error cleaning up expired tokens:', error);
      throw error;
    }
  }

  static extractDeviceInfo(req) {
    const userAgent = req.headers['user-agent'] || '';
    const ip = req.ip || req.connection.remoteAddress;

    return {
      userAgent,
      ip,
      device: this.extractDevice(userAgent),
      browser: this.extractBrowser(userAgent),
      os: this.extractOS(userAgent)
    };
  }

  static extractDevice(userAgent) {
    if (!userAgent) return 'Unknown';
    
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      return /iPad/.test(userAgent) ? 'Tablet' : 'Mobile';
    }
    return 'Desktop';
  }

  static extractBrowser(userAgent) {
    if (!userAgent) return 'Unknown';
    
    if (/Chrome/.test(userAgent)) return 'Chrome';
    if (/Firefox/.test(userAgent)) return 'Firefox';
    if (/Safari/.test(userAgent)) return 'Safari';
    if (/Edge/.test(userAgent)) return 'Edge';
    return 'Other';
  }

  static extractOS(userAgent) {
    if (!userAgent) return 'Unknown';
    
    if (/Windows/.test(userAgent)) return 'Windows';
    if (/Mac/.test(userAgent)) return 'macOS';
    if (/Linux/.test(userAgent)) return 'Linux';
    if (/Android/.test(userAgent)) return 'Android';
    if (/iOS|iPhone|iPad/.test(userAgent)) return 'iOS';
    return 'Other';
  }
}

module.exports = AuthService;
