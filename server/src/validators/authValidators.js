const { body } = require("express-validator");

exports.registerValidator = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("phone")
    .matches(/^[0-9]{10,15}$/)
    .withMessage("Phone must be 10 to 15 digits"),
  body("city").optional().trim().isLength({ min: 2 }).withMessage("City is too short"),
  body("country").optional().trim().isLength({ min: 2 }).withMessage("Country is too short"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 chars"),
];

exports.loginValidator = [
  body("identifier")
    .notEmpty()
    .withMessage("Email or phone is required")
    .custom((value) => {
      const text = String(value).trim();
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
      const isPhone = /^[0-9]{10,15}$/.test(text.replace(/\D/g, ""));
      if (!isEmail && !isPhone) {
        throw new Error("Enter a valid email or phone number");
      }
      return true;
    }),
  body("password").notEmpty().withMessage("Password is required"),
];

exports.verifyContactValidator = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("phone")
    .matches(/^[0-9]{10,15}$/)
    .withMessage("Phone must be 10 to 15 digits"),
  body("emailOtp")
    .optional()
    .matches(/^[0-9]*$/)
    .withMessage("Email OTP must be 6 digits"),
  body("phoneOtp")
    .matches(/^[0-9]{6}$/)
    .withMessage("Phone OTP must be 6 digits"),
];

exports.resendOtpValidator = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("phone")
    .matches(/^[0-9]{10,15}$/)
    .withMessage("Phone must be 10 to 15 digits"),
];

exports.updateProfileValidator = [
  body("name").optional().trim().isLength({ min: 2 }).withMessage("Name is too short"),
  body("email").optional().isEmail().withMessage("Valid email is required"),
  body("phone")
    .optional()
    .matches(/^[0-9]{10,15}$/)
    .withMessage("Phone must be 10 to 15 digits"),
  body("city").optional().trim().isLength({ min: 2 }).withMessage("City is too short"),
  body("country").optional().trim().isLength({ min: 2 }).withMessage("Country is too short"),
];
