const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');

const authenticate = (req, res, next) => {
  // Try to get token from:
  // 1. httpOnly cookie (preferred)
  // 2. Authorization header (for backwards compatibility)
  let token = req.cookies?.authToken || req.headers.authorization?.split(' ')[1];

  console.log('[Auth] Authenticate check - cookies:', Object.keys(req.cookies || {}), 'token found:', !!token);

  if (!token) {
    throw new AppError('Missing authorization token', 401, 'UNAUTHORIZED');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      // Clear expired cookie
      res.clearCookie('authToken');
      throw new AppError('Token expired. Please login again', 401, 'TOKEN_EXPIRED');
    } else if (error.name === 'JsonWebTokenError') {
      throw new AppError('Invalid token', 401, 'INVALID_TOKEN');
    }
    throw new AppError('Authentication failed', 401, 'UNAUTHORIZED');
  }
};

module.exports = authenticate;
