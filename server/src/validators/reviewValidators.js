const { body } = require("express-validator");

exports.reviewValidator = [
  body("hotelId").isMongoId().withMessage("Valid hotelId required"),
  body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be 1 to 5"),
  body("comment").trim().isLength({ min: 5 }).withMessage("Comment too short"),
];
