// Input validation service for AHP matrices and judgments

const CR_THRESHOLD = 0.10;
// Upper bound on pairwise-comparison matrix dimension. Saaty's own AHP
// guidance caps practical comparisons at ~9-15 items; 20 leaves headroom
// for real use while keeping buildMatrix's n×n allocation bounded (a
// crafted index like "0-999999999" would otherwise allocate a huge array).
const MAX_MATRIX_SIZE = 20;

// Validate pairwise comparison matrix
const validateMatrix = (matrix, levelId) => {
  const errors = [];

  // Check if matrix is valid array
  if (!Array.isArray(matrix)) {
    errors.push('Matrix must be an array');
    return errors;
  }

  if (matrix.length === 0) {
    errors.push('Matrix cannot be empty');
    return errors;
  }

  const n = matrix.length;

  // Check if matrix is square
  for (let i = 0; i < n; i++) {
    if (!Array.isArray(matrix[i]) || matrix[i].length !== n) {
      errors.push(`Matrix row ${i} is not length ${n}`);
    }
  }

  if (errors.length > 0) return errors;

  // Check diagonal values (must be 1)
  for (let i = 0; i < n; i++) {
    if (matrix[i][i] !== 1) {
      errors.push(`Matrix diagonal[${i}][${i}] must be 1, got ${matrix[i][i]}`);
    }
  }

  // Check Saaty scale (1-9) and reciprocal property
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const value = matrix[i][j];
      const reciprocal = matrix[j][i];

      // Check if value is positive number
      if (typeof value !== 'number' || value <= 0) {
        errors.push(`Matrix[${i}][${j}] must be positive number, got ${value}`);
        continue;
      }

      // Check Saaty scale (1-9 or 1/9 to 1)
      if ((value < 1 || value > 9) && (1 / value < 1 || 1 / value > 9)) {
        errors.push(
          `Matrix[${i}][${j}] = ${value} is outside Saaty scale (1-9)`
        );
      }

      // Check reciprocal property: M[i,j] * M[j,i] should equal 1
      const product = value * reciprocal;
      if (Math.abs(product - 1) > 0.01) {
        // Allow 1% tolerance for floating point errors
        errors.push(
          `Matrix[${i}][${j}] and Matrix[${j}][${i}] are not reciprocals: ${value} * ${reciprocal} = ${product}`
        );
      }
    }
  }

  return errors;
};

// Validate sparse judgment input from frontend
const validateSparseJudgments = (sparse) => {
  const errors = [];

  if (!sparse || typeof sparse !== 'object') {
    errors.push('Judgments must be an object');
    return errors;
  }

  // Check each comparison
  for (const key in sparse) {
    const [i, j] = key.split('-').map(Number);
    const value = sparse[key];

    // Validate key format
    if (isNaN(i) || isNaN(j)) {
      errors.push(`Invalid comparison key: ${key}. Expected format: "i-j"`);
      continue;
    }

    // Bound indices so a crafted payload can't force a huge matrix allocation
    if (i < 0 || j < 0 || i >= MAX_MATRIX_SIZE || j >= MAX_MATRIX_SIZE) {
      errors.push(
        `Comparison ${key} is out of bounds - indices must be between 0 and ${MAX_MATRIX_SIZE - 1}`
      );
      continue;
    }

    // Validate value is in Saaty scale
    if (typeof value !== 'number' || value <= 0) {
      errors.push(`Comparison ${key} must be positive number, got ${value}`);
      continue;
    }

    if ((value < 1 || value > 9) && (1 / value < 1 || 1 / value > 9)) {
      errors.push(
        `Comparison ${key} = ${value} is outside Saaty scale (1-9)`
      );
    }
  }

  return errors;
};

// Check if consistency ratio is acceptable
const checkConsistencyRatio = (cr) => {
  const warnings = [];

  if (cr > CR_THRESHOLD) {
    warnings.push(
      `Consistency Ratio (${cr.toFixed(4)}) exceeds threshold (${CR_THRESHOLD}). Judgments may be inconsistent.`
    );
  }

  return { isAcceptable: cr <= CR_THRESHOLD, warnings };
};

// Validate expert data
const validateExpertJudgment = (caseId, expertId, levelId, sparse) => {
  const errors = [];

  // Validate UUIDs/IDs
  if (!caseId || typeof caseId !== 'string') {
    errors.push('caseId is required and must be a string');
  }

  if (!expertId || typeof expertId !== 'string') {
    errors.push('expertId is required and must be a string');
  }

  if (!levelId || typeof levelId !== 'string') {
    errors.push('levelId is required and must be a string');
  }

  // Validate judgments
  const sparseErrors = validateSparseJudgments(sparse);
  errors.push(...sparseErrors);

  return errors;
};

module.exports = {
  validateMatrix,
  validateSparseJudgments,
  validateExpertJudgment,
  checkConsistencyRatio,
  CR_THRESHOLD,
  MAX_MATRIX_SIZE,
};
