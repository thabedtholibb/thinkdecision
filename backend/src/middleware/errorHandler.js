const { errorLogger } = require('../services/loggerService');

class AppError extends Error {
  constructor(message, statusCode, code = 'INTERNAL_ERROR', details = []) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

const errorHandler = (err, req, res, next) => {
  errorLogger.error(err.message, err, {
    statusCode: err.statusCode || 500,
    code: err.code,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
    ip: req.ip,
  });

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? [err.message] : [],
    },
  });
};

module.exports = errorHandler;
module.exports.AppError = AppError;
