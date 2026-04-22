const axios = require('axios');
const crypto = require('crypto');
const User = require('../models/User');
const AuthService = require('./authService');

class OAuthService {
  static async getGoogleAuthURL() {
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
      state: this.generateState()
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  static async handleGoogleCallback(code, state, deviceInfo = {}) {
    try {
      // Verify state to prevent CSRF
      if (!this.verifyState(state)) {
        throw new Error('Invalid state parameter');
      }

      // Exchange code for tokens
      const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code'
      });

      const { access_token, id_token } = tokenResponse.data;

      // Get user info from Google
      const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${access_token}`
        }
      });

      const googleUser = userInfoResponse.data;

      // Find or create user
      let user = await User.findOne({ email: googleUser.email });
      
      if (!user) {
        // Create new user
        user = new User({
          name: googleUser.name,
          email: googleUser.email,
          avatar: googleUser.picture,
          emailVerified: true,
          phoneVerified: false, // Will need to be verified separately
          phone: '', // Will need to be added later
          password: crypto.randomBytes(32).toString('hex') // Random password for OAuth users
        });
        
        await user.save();
      } else {
        // Update existing user's avatar if not set
        if (!user.avatar && googleUser.picture) {
          user.avatar = googleUser.picture;
          user.emailVerified = true;
          await user.save();
        }
      }

      // Generate tokens
      const tokens = AuthService.generateTokens(user);
      await AuthService.createRefreshToken(user, deviceInfo);

      // Track OAuth login
      await redisService.trackEvent('oauth_login', {
        userId: user._id,
        provider: 'google',
        device: deviceInfo.device
      });

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          isNewUser: !user.phone // Check if user needs to complete profile
        }
      };
    } catch (error) {
      console.error('Google OAuth error:', error);
      throw new Error('OAuth authentication failed');
    }
  }

  static async getFacebookAuthURL() {
    const params = new URLSearchParams({
      client_id: process.env.FACEBOOK_APP_ID,
      redirect_uri: process.env.FACEBOOK_REDIRECT_URI,
      response_type: 'code',
      scope: 'email public_profile',
      state: this.generateState()
    });

    return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
  }

  static async handleFacebookCallback(code, state, deviceInfo = {}) {
    try {
      // Verify state
      if (!this.verifyState(state)) {
        throw new Error('Invalid state parameter');
      }

      // Exchange code for access token
      const tokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
        params: {
          client_id: process.env.FACEBOOK_APP_ID,
          client_secret: process.env.FACEBOOK_APP_SECRET,
          code,
          redirect_uri: process.env.FACEBOOK_REDIRECT_URI
        }
      });

      const { access_token } = tokenResponse.data;

      // Get user info from Facebook
      const userInfoResponse = await axios.get('https://graph.facebook.com/me', {
        params: {
          fields: 'id,name,email,picture.type(large)',
          access_token
        }
      });

      const facebookUser = userInfoResponse.data;

      // Find or create user
      let user = await User.findOne({ email: facebookUser.email });
      
      if (!user) {
        user = new User({
          name: facebookUser.name,
          email: facebookUser.email,
          avatar: facebookUser.picture?.data?.url,
          emailVerified: true,
          phoneVerified: false,
          phone: '',
          password: crypto.randomBytes(32).toString('hex')
        });
        
        await user.save();
      } else {
        if (!user.avatar && facebookUser.picture?.data?.url) {
          user.avatar = facebookUser.picture.data.url;
          user.emailVerified = true;
          await user.save();
        }
      }

      // Generate tokens
      const tokens = AuthService.generateTokens(user);
      await AuthService.createRefreshToken(user, deviceInfo);

      // Track OAuth login
      await redisService.trackEvent('oauth_login', {
        userId: user._id,
        provider: 'facebook',
        device: deviceInfo.device
      });

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          isNewUser: !user.phone
        }
      };
    } catch (error) {
      console.error('Facebook OAuth error:', error);
      throw new Error('OAuth authentication failed');
    }
  }

  static generateState() {
    return crypto.randomBytes(16).toString('hex');
  }

  static verifyState(state) {
    // In production, store state in Redis or database with expiration
    // For now, just verify it's a valid hex string of correct length
    return /^[a-f0-9]{32}$/i.test(state);
  }

  static async linkOAuthAccount(userId, provider, providerId, profileData) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Store OAuth linkage in user profile or separate OAuthAccount model
      // For simplicity, we'll add it to the user model
      if (!user.oauthAccounts) {
        user.oauthAccounts = [];
      }

      const existingLink = user.oauthAccounts.find(
        account => account.provider === provider
      );

      if (existingLink) {
        throw new Error(`${provider} account already linked`);
      }

      user.oauthAccounts.push({
        provider,
        providerId,
        profileData,
        linkedAt: new Date()
      });

      await user.save();
      return true;
    } catch (error) {
      console.error('Error linking OAuth account:', error);
      throw error;
    }
  }

  static async unlinkOAuthAccount(userId, provider) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      user.oauthAccounts = user.oauthAccounts.filter(
        account => account.provider !== provider
      );

      await user.save();
      return true;
    } catch (error) {
      console.error('Error unlinking OAuth account:', error);
      throw error;
    }
  }

  static async getLinkedAccounts(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      return user.oauthAccounts || [];
    } catch (error) {
      console.error('Error getting linked accounts:', error);
      throw error;
    }
  }

  static async validateOAuthToken(provider, token) {
    try {
      let userInfo;

      switch (provider) {
        case 'google':
          const googleResponse = await axios.get(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${token}`);
          userInfo = googleResponse.data;
          break;
        
        case 'facebook':
          const facebookResponse = await axios.get(`https://graph.facebook.com/me?fields=id,name,email&access_token=${token}`);
          userInfo = facebookResponse.data;
          break;
        
        default:
          throw new Error('Unsupported OAuth provider');
      }

      return userInfo;
    } catch (error) {
      console.error('Error validating OAuth token:', error);
      throw new Error('Invalid OAuth token');
    }
  }
}

module.exports = OAuthService;
