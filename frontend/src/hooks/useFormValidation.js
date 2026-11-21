/* Form Validation Hook — custom lightweight validation for CDN-based React */
const { useState, useCallback, useRef } = React;

// Reads the live language directly from the DOM rather than through a hook:
// validators are plain functions called from many components, not React
// components themselves, and AppContext already keeps this attribute in
// sync with the language toggle on every change.
const getValidationLang = () => (document.documentElement.lang === 'id' ? 'id' : 'en');

// Validation rules library
const validators = {
  required: (value) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return translate('validation.required', getValidationLang());
    }
    return null;
  },

  email: (value) => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return translate('validation.email', getValidationLang());
    }
    return null;
  },

  minLength: (min) => (value) => {
    if (!value) return null;
    if (value.length < min) {
      return translate('validation.minLength', getValidationLang(), { min });
    }
    return null;
  },

  maxLength: (max) => (value) => {
    if (!value) return null;
    if (value.length > max) {
      return translate('validation.maxLength', getValidationLang(), { max });
    }
    return null;
  },

  pattern: (pattern, message) => (value) => {
    if (!value) return null;
    if (!pattern.test(value)) {
      return message || translate('validation.pattern', getValidationLang());
    }
    return null;
  },

  numeric: (value) => {
    if (!value) return null;
    if (isNaN(value) || isNaN(parseFloat(value))) {
      return translate('validation.numeric', getValidationLang());
    }
    return null;
  },

  password: (value) => {
    if (!value) return null;
    const lang = getValidationLang();
    if (value.length < 8) return translate('validation.password.minLength', lang);
    if (!/[A-Z]/.test(value)) return translate('validation.password.uppercase', lang);
    if (!/[a-z]/.test(value)) return translate('validation.password.lowercase', lang);
    if (!/[0-9]/.test(value)) return translate('validation.password.digit', lang);
    return null;
  },

  match: (fieldName, getOtherValue) => (value) => {
    if (!value) return null;
    const otherValue = getOtherValue();
    if (value !== otherValue) {
      return translate('validation.match', getValidationLang(), { fieldName });
    }
    return null;
  },
};

// Custom hook for form handling
function useFormValidation(initialValues, validationRules, onSubmit) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const formRef = useRef(null);

  // Validate single field
  const validateField = useCallback((fieldName, value) => {
    const rules = validationRules[fieldName];
    if (!rules) return null;

    const rulesList = Array.isArray(rules) ? rules : [rules];
    for (const rule of rulesList) {
      const error = typeof rule === 'function' ? rule(value) : null;
      if (error) return error;
    }
    return null;
  }, [validationRules]);

  // Validate all fields
  const validateForm = useCallback(() => {
    const newErrors = {};
    Object.keys(validationRules).forEach(fieldName => {
      const error = validateField(fieldName, values[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
      }
    });
    return newErrors;
  }, [validationRules, values, validateField]);

  // Handle field change
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setValues(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Real-time validation if field was touched
    if (touched[name]) {
      const error = validateField(name, newValue);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  }, [touched, validateField]);

  // Handle field blur
  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));

    const error = validateField(name, values[name]);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  }, [values, validateField]);

  // Handle form submit
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    const newErrors = validateForm();
    setErrors(newErrors);

    // Mark all fields as touched
    const allTouched = Object.keys(validationRules).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);

    if (Object.keys(newErrors).length === 0) {
      try {
        onSubmit(values, { setSubmitting: (bool) => setIsSubmitting(bool), setErrors: (err) => setErrors(err) });
      } catch (err) {
        setSubmitError(err.message || translate('validation.submitFailed', getValidationLang()));
        setIsSubmitting(false);
      }
    } else {
      setIsSubmitting(false);
    }
  }, [values, validationRules, validateForm, onSubmit]);

  // Reset form
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setSubmitError(null);
  }, [initialValues]);

  // Set field value programmatically
  const setFieldValue = useCallback((fieldName, value) => {
    setValues(prev => ({
      ...prev,
      [fieldName]: value
    }));
  }, []);

  // Set field error programmatically
  const setFieldError = useCallback((fieldName, error) => {
    setErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));
  }, []);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    submitError,
    formRef,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setFieldValue,
    setFieldError,
    validateField,
    validateForm,
  };
}

// Export validators and hook
if (typeof window !== 'undefined') {
  window.useFormValidation = useFormValidation;
  window.validators = validators;
}

Object.assign(window, {
  useFormValidation,
  validators,
});
