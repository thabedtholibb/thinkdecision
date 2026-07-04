const xss = require('xss');

// Improvement 18: Input Sanitization Service
// Prevents XSS attacks by sanitizing all user input before database storage

const sanitizeOptions = {
  whiteList: {},
  stripIgnoredTag: true,
  stripLeadingAndTrailingWhitespace: true,
};

const stripHtmlOptions = {
  whiteList: {},
  stripIgnoredTag: true,
};

// Sanitize single string input (removes all HTML tags)
const sanitizeText = (text) => {
  if (!text || typeof text !== 'string') {
    return text;
  }
  return xss(text, stripHtmlOptions);
};

// Sanitize object properties (recursive)
const sanitizeObject = (obj, fieldsToSanitize = null) => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const sanitized = Array.isArray(obj) ? [...obj] : { ...obj };

  Object.keys(sanitized).forEach((key) => {
    // Skip fields that shouldn't be sanitized (IDs, booleans, numbers)
    if (fieldsToSanitize && !fieldsToSanitize.includes(key)) {
      return;
    }
    if (['id', 'user_id', 'case_id', 'expert_id', 'created_at', 'updated_at', 'deleted_at'].includes(key)) {
      return;
    }

    const value = sanitized[key];

    if (typeof value === 'string') {
      sanitized[key] = sanitizeText(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, fieldsToSanitize);
    }
  });

  return sanitized;
};

// Sanitize specific fields only
const sanitizeFields = (obj, fields) => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const sanitized = { ...obj };

  fields.forEach((field) => {
    if (sanitized[field] && typeof sanitized[field] === 'string') {
      sanitized[field] = sanitizeText(sanitized[field]);
    }
  });

  return sanitized;
};

module.exports = {
  sanitizeText,
  sanitizeObject,
  sanitizeFields,
};
