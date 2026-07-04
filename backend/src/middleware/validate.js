const { AppError } = require('./errorHandler');

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);

    if (error) {
      throw new AppError(
        'Validation failed',
        400,
        'VALIDATION_ERROR',
        error.details.map(d => ({
          field: d.path.join('.'),
          message: d.message,
        }))
      );
    }

    req.validatedBody = value;
    next();
  };
};

module.exports = validate;
