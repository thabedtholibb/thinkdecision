const rateLimit = require('express-rate-limit');

// Rate limiter for login endpoints (brute force protection)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes per IP
  message: 'Terlalu banyak percobaan login. Silakan coba lagi dalam 15 menit.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.path === '/' || req.path === '/health';
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        message: 'Terlalu banyak percobaan login. Silakan coba lagi dalam 15 menit.',
        code: 'RATE_LIMIT_EXCEEDED'
      }
    });
  }
});

// PUBLIC endpoints limiter: 100 requests per minute per IP
const publicLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        message: 'Terlalu banyak permintaan dari IP ini. Silakan coba lagi nanti.',
        code: 'RATE_LIMIT_EXCEEDED'
      }
    });
  }
});

// AUTHENTICATED endpoints limiter: 1000 requests per minute per user
const authenticatedLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // 1000 requests per minute per user
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !req.user, // Only apply to authenticated requests
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        message: 'Terlalu banyak permintaan. Silakan coba lagi nanti.',
        code: 'RATE_LIMIT_EXCEEDED'
      }
    });
  }
});

// ADMIN endpoints limiter: 5000 requests per minute per admin
const adminLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5000, // 5000 requests per minute per admin
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !req.user || req.user.role !== 'admin',
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        message: 'Admin rate limit exceeded.',
        code: 'RATE_LIMIT_EXCEEDED'
      }
    });
  }
});

module.exports = {
  loginLimiter,
  publicLimiter,
  authenticatedLimiter,
  adminLimiter
};
