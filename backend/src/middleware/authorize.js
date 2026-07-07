const { ForbiddenError } = require('../errors/AppErrors');

// Restrict a route to one or more roles (e.g. requireRole('creator'))
// Must run after `authenticate` so req.user is populated.
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    throw new ForbiddenError('You do not have permission to perform this action');
  }
  next();
};

module.exports = { requireRole };
