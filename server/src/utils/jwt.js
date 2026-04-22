const jwt = require("jsonwebtoken");

const getAccessSecret = () => process.env.JWT_SECRET;
const getRefreshSecret = () => process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

exports.signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, getAccessSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
  });

exports.signRefreshToken = (user) =>
  jwt.sign({ id: user._id, role: user.role, type: "refresh" }, getRefreshSecret(), {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  });

exports.verifyRefreshToken = (token) => jwt.verify(token, getRefreshSecret());
