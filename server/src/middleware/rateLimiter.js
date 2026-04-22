const rateLimit = require("express-rate-limit");

function buildLimiter({
  windowMs,
  max,
  message,
}) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message },
  });
}

const authLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: "Too many auth requests. Please try again in 15 minutes.",
});

const searchLimiter = buildLimiter({
  windowMs: 60 * 1000,
  max: 120,
  message: "Too many search requests. Please slow down.",
});

const paymentsLimiter = buildLimiter({
  windowMs: 10 * 60 * 1000,
  max: 80,
  message: "Too many payment requests. Please try again shortly.",
});

module.exports = {
  authLimiter,
  searchLimiter,
  paymentsLimiter,
};
