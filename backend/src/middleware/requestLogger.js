const { apiLogger } = require('../services/loggerService');

const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'warn' : 'info';

    apiLogger[level](`${req.method} ${req.path}`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      method: req.method,
      path: req.path,
      ip: req.ip,
      userId: req.user?.id,
      userEmail: req.user?.email,
      userRole: req.user?.role,
    });
  });

  next();
};

module.exports = requestLogger;
