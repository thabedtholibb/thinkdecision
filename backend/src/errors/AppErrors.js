// Centralized error definitions with proper error codes.
// Only classes actually thrown somewhere in the codebase are kept here —
// an earlier version defined ~20 subclasses where roughly half were never
// thrown, which meant real errors either fell back to a generic AppError
// or (worse) a plain Error that errorHandler couldn't recognize.

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

// Conflict errors
class DuplicateEmailError extends AppError {
  constructor(email) {
    super(`Email ${email} is already registered`, 409, 'DUPLICATE_EMAIL');
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
  MatrixValidationError,

  // Resources
  NotFoundError,
  CaseNotFoundError,
  ExpertNotFoundError,

  // Conflicts
  DuplicateEmailError,
};
