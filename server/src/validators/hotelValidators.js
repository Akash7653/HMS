const { body } = require("express-validator");

exports.hotelValidator = [
  body("name").trim().notEmpty().withMessage("Hotel name is required"),
  body("description").trim().isLength({ min: 10 }).withMessage("Description too short"),
  body("location.city").trim().notEmpty().withMessage("City is required"),
  body("location.address").trim().notEmpty().withMessage("Address is required"),
  body("location.country").trim().notEmpty().withMessage("Country is required"),
  body("roomTypes").isArray({ min: 1 }).withMessage("At least one room type required"),
];
