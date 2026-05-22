const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');

// 20 AI calls per hour per user (identified by user ID from JWT or IP)
const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  keyGenerator: (req, res) => {
    // Use user ID if authenticated, fall back to IP (IPv6-safe)
    return req.user ? `user_${req.user.id}` : ipKeyGenerator(req, res);
  },
  message: { error: 'Too many AI analysis requests. Limit is 20 per hour. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { aiRateLimiter };
