const sanitizationService = require('../services/sanitizationService');

// Improvement 18: Sanitization Middleware
// Sanitizes all incoming request body to prevent XSS attacks
// Applies to: case names, descriptions, criteria names, user input fields

const fieldsToSanitize = {
  name: true,
  description: true,
  title: true,
  message: true,
  content: true,
  notes: true,
  objective: true,
  criteria_name: true,
  alternative_name: true,
  user_input: true,
};

const sanitizationMiddleware = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    // Sanitize request body
    try {
      sanitizeObject(req.body);
    } catch (error) {
      console.error('[Sanitization] Error sanitizing request body:', error);
      // Continue without sanitization on error
    }
  }

  next();
};

// Recursively sanitize object properties
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return;
  }

  Object.keys(obj).forEach((key) => {
    const value = obj[key];

    // Sanitize string values in specified fields
    if (typeof value === 'string') {
      // Check if field should be sanitized
      if (shouldSanitizeField(key)) {
        obj[key] = sanitizationService.sanitizeText(value);
      }
    } else if (Array.isArray(value)) {
      // Recursively sanitize array items
      value.forEach((item) => {
        if (typeof item === 'object' && item !== null) {
          sanitizeObject(item);
        } else if (typeof item === 'string' && shouldSanitizeField(key)) {
          const index = value.indexOf(item);
          value[index] = sanitizationService.sanitizeText(item);
        }
      });
    } else if (typeof value === 'object' && value !== null) {
      // Recursively sanitize nested objects
      sanitizeObject(value);
    }
  });
};

// Determine if a field should be sanitized
const shouldSanitizeField = (fieldName) => {
  // Check exact matches
  if (fieldsToSanitize[fieldName]) {
    return true;
  }

  // Check if field name contains suspicious keywords
  const lowerFieldName = fieldName.toLowerCase();
  const sanitizeKeywords = ['name', 'description', 'title', 'message', 'content', 'notes', 'objective'];

  return sanitizeKeywords.some((keyword) => lowerFieldName.includes(keyword));
};

module.exports = sanitizationMiddleware;
