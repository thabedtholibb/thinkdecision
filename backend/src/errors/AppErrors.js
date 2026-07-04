// Centralized error definitions with proper error codes

const { AppError } = require('../middleware/errorHandler');

// Authentication errors
class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class InvalidCredentialsError extends AppError {
  constructor() {
    super('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }
}

class TokenExpiredError extends AppError {
  constructor() {
    super('Token has expired', 401, 'TOKEN_EXPIRED');
  }
}

class InvalidTokenError extends AppError {
  constructor() {
    super('Invalid token', 401, 'INVALID_TOKEN');
  }
}

// Authorization errors
class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
  }
}

// Validation errors
class ValidationError extends AppError {
  constructor(message = 'Validation failed', details = []) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

class InvalidInputError extends AppError {
  constructor(field, message) {
    super(`Invalid input for ${field}: ${message}`, 400, 'INVALID_INPUT');
    this.field = field;
  }
}

class MatrixValidationError extends AppError {
  constructor(details = []) {
    super('Matrix validation failed', 400, 'MATRIX_VALIDATION_ERROR', details);
  }
}

// Resource errors
class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

class CaseNotFoundError extends AppError {
  constructor() {
    super('Case not found', 404, 'CASE_NOT_FOUND');
  }
}

class ExpertNotFoundError extends AppError {
  constructor() {
    super('Expert not found', 404, 'EXPERT_NOT_FOUND');
  }
}

class JudgmentNotFoundError extends AppError {
  constructor() {
    super('Judgment not found', 404, 'JUDGMENT_NOT_FOUND');
  }
}

// Conflict errors
class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409, 'CONFLICT');
  }
}

class DuplicateEmailError extends AppError {
  constructor(email) {
    super(`Email ${email} is already registered`, 409, 'DUPLICATE_EMAIL');
  }
}

// Business logic errors
class InvalidStateError extends AppError {
  constructor(message) {
    super(message, 422, 'INVALID_STATE');
  }
}

class InconsistentDataError extends AppError {
  constructor(details = []) {
    super('Data inconsistency detected', 422, 'INCONSISTENT_DATA', details);
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

// Database errors
class DatabaseError extends AppError {
  constructor(message = 'Database operation failed') {
    super(message, 500, 'DATABASE_ERROR');
  }
}

class QueryError extends AppError {
  constructor(message = 'Query execution failed') {
    super(message, 500, 'QUERY_ERROR');
  }
}

// Server errors
class InternalServerError extends AppError {
  constructor(message = 'Internal server error') {
    super(message, 500, 'INTERNAL_ERROR');
  }
}

class ServiceUnavailableError extends AppError {
  constructor(service = 'Service') {
    super(`${service} is temporarily unavailable`, 503, 'SERVICE_UNAVAILABLE');
  }
}

module.exports = {
  // Authentication
  UnauthorizedError,
  InvalidCredentialsError,
  TokenExpiredError,
  InvalidTokenError,

  // Authorization
  ForbiddenError,

  // Validation
  ValidationError,
  InvalidInputError,
  MatrixValidationError,

  // Resources
  NotFoundError,
  CaseNotFoundError,
  ExpertNotFoundError,
  JudgmentNotFoundError,

  // Conflicts
  ConflictError,
  DuplicateEmailError,

  // Business logic
  InvalidStateError,
  InconsistentDataError,
  RateLimitError,

  // Database
  DatabaseError,
  QueryError,

  // Server
  InternalServerError,
  ServiceUnavailableError,
};
