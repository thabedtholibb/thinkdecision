const jwt = require('jsonwebtoken');
const { UnauthorizedError, TokenExpiredError, InvalidTokenError } = require('../errors/AppErrors');

const authenticate = (req, res, next) => {
  // Try to get token from:
  // 1. httpOnly cookie (preferred)
  // 2. Authorization header (for backwards compatibility)
  let token = req.cookies?.authToken || req.headers.authorization?.split(' ')[1];

  if (!token) {
    throw new UnauthorizedError('Missing authorization token');
  }

  try {
    // Pin the algorithm: tokens are always signed HS256 (see authService.js),
    // so refuse anything else rather than letting the token dictate it.
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      // Clear expired cookie
      res.clearCookie('authToken');
      throw new TokenExpiredError();
    } else if (error.name === 'JsonWebTokenError') {
      throw new InvalidTokenError();
    }
    throw new UnauthorizedError('Authentication failed');
  }
};

module.exports = authenticate;
