const User = require("../models/User");
const { signToken } = require("../utils/jwt");
const { sendEmailSimulation } = require("../services/emailService");
const { sendSmsOtp } = require("../services/smsService");

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone, city, country } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: "Email already in use" });

    const phoneExists = await User.findOne({ phone });
    if (phoneExists) return res.status(409).json({ message: "Phone already in use" });

    const phoneOtp = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const user = await User.create({
      name,
      email,
      password,
      phone,
      city,
      country,
      emailVerified: true, // Email is auto-verified since user provides it
      phoneVerified: false, // Phone needs OTP verification
      emailOtp: "",
      phoneOtp,
      otpExpiresAt,
    });

    await sendEmailSimulation({
      to: email,
      subject: "Horizon-Hotels registration initiated",
      html: `<p>Your account setup has started. Please complete phone OTP verification to activate your account.</p>`,
    });

    await sendSmsOtp({ phone, otp: phoneOtp, reason: "registration" });

    res.status(201).json({
      message: "Account created. Please verify phone using OTP.",
      verificationRequired: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.verifyContact = async (req, res, next) => {
  try {
    const { email, phone, phoneOtp, emailOtp } = req.body;

    const user = await User.findOne({ email, phone }).select("+emailOtp +phoneOtp +otpExpiresAt");
    if (!user) {
      return res.status(404).json({ message: "User not found for provided contact details" });
    }

    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired. Please request a new OTP." });
    }

    // Verify phone OTP (always required)
    if (!phoneOtp || user.phoneOtp !== phoneOtp) {
      return res.status(400).json({ message: "Invalid phone OTP" });
    }

    // Verify email OTP only if provided and user requires it
    if (emailOtp && user.emailOtp) {
      if (user.emailOtp !== emailOtp) {
        return res.status(400).json({ message: "Invalid email OTP" });
      }
      user.emailVerified = true;
    }

    user.phoneVerified = true;
    user.emailOtp = "";
    user.phoneOtp = "";
    user.otpExpiresAt = undefined;
    await user.save();

    const token = signToken(user);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        city: user.city,
        country: user.country,
        role: user.role,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.resendOtp = async (req, res, next) => {
  try {
    const { email, phone } = req.body;

    const user = await User.findOne({ email, phone }).select("+emailOtp +phoneOtp +otpExpiresAt");
    if (!user) {
      return res.status(404).json({ message: "User not found for provided contact details" });
    }

    if (user.emailVerified && user.phoneVerified) {
      return res.status(400).json({ message: "Account already verified" });
    }

    user.emailOtp = generateOtp();
    user.phoneOtp = generateOtp();
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendEmailSimulation({
      to: email,
      subject: "Your new Horizon-Hotels verification OTP",
      html: `<p>Your phone OTP has been regenerated. Please use the latest OTP sent to your mobile.</p>`,
    });

    await sendSmsOtp({ phone: user.phone, otp: user.phoneOtp, reason: "resend" });

    res.json({
      message: "New OTP sent",
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

    if (!user.phoneVerified) {
      return res.status(403).json({ message: "Please verify your phone number before login" });
    }

    const token = signToken(user);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        city: user.city,
        country: user.country,
        role: user.role,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.me = async (req, res) => {
  res.json({ user: req.user });
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, email, phone, city, country } = req.body;
    const user = await User.findById(req.user._id).select("+emailOtp +phoneOtp +otpExpiresAt");

    if (!user) return res.status(404).json({ message: "User not found" });

    if (email && email !== user.email) {
      const emailTaken = await User.findOne({ email, _id: { $ne: user._id } });
      if (emailTaken) return res.status(409).json({ message: "Email already in use" });
      user.email = email;
      user.emailVerified = false;
    }

    if (phone && phone !== user.phone) {
      const phoneTaken = await User.findOne({ phone, _id: { $ne: user._id } });
      if (phoneTaken) return res.status(409).json({ message: "Phone already in use" });
      user.phone = phone;
      user.phoneVerified = false;
    }

    if (typeof name === "string") user.name = name;
    if (typeof city === "string") user.city = city;
    if (typeof country === "string") user.country = country;

    if (!user.emailVerified || !user.phoneVerified) {
      user.emailOtp = generateOtp();
      user.phoneOtp = generateOtp();
      user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await sendEmailSimulation({
        to: user.email,
        subject: "Verify updated Horizon-Hotels contact details",
        html: `<p>Your profile was updated. Please complete phone OTP verification to continue secure access.</p>`,
      });

      await sendSmsOtp({ phone: user.phone, otp: user.phoneOtp, reason: "profile-update" });
    }

    await user.save();

    res.json({
      message: "Profile updated",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        city: user.city,
        country: user.country,
        role: user.role,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
      },
      verificationRequired: !user.emailVerified || !user.phoneVerified,
    });
  } catch (error) {
    next(error);
  }
};

