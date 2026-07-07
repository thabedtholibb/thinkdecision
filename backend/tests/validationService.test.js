const validationService = require('../src/services/validationService');

describe('validationService.validateSparseJudgments', () => {
  test('accepts valid Saaty-scale comparisons within bounds', () => {
    const errors = validationService.validateSparseJudgments({ '0-1': 3, '0-2': 1 / 5 });
    expect(errors).toEqual([]);
  });

  test('rejects a comparison key with a non-numeric index', () => {
    const errors = validationService.validateSparseJudgments({ 'a-1': 3 });
    expect(errors.length).toBeGreaterThan(0);
  });

  test('rejects a value outside the Saaty 1-9 scale', () => {
    const errors = validationService.validateSparseJudgments({ '0-1': 15 });
    expect(errors.some(e => e.includes('Saaty scale'))).toBe(true);
  });

  test('rejects indices at or beyond MAX_MATRIX_SIZE (DoS guard)', () => {
    const oversizedKey = `0-${validationService.MAX_MATRIX_SIZE}`;
    const errors = validationService.validateSparseJudgments({ [oversizedKey]: 2 });
    expect(errors.some(e => e.includes('out of bounds'))).toBe(true);
  });

  test('rejects a crafted huge index that would otherwise blow up matrix allocation', () => {
    const errors = validationService.validateSparseJudgments({ '0-999999999': 2 });
    expect(errors.some(e => e.includes('out of bounds'))).toBe(true);
  });

  test('accepts the largest in-bounds index (MAX_MATRIX_SIZE - 1)', () => {
    const maxKey = `0-${validationService.MAX_MATRIX_SIZE - 1}`;
    const errors = validationService.validateSparseJudgments({ [maxKey]: 2 });
    expect(errors).toEqual([]);
  });
});

describe('validationService.validateMatrix', () => {
  test('accepts a valid reciprocal square matrix', () => {
    const matrix = [
      [1, 2],
      [1 / 2, 1],
    ];
    expect(validationService.validateMatrix(matrix, 'crit')).toEqual([]);
  });

  test('rejects a non-square matrix', () => {
    const matrix = [
      [1, 2, 3],
      [1 / 2, 1],
    ];
    expect(validationService.validateMatrix(matrix, 'crit').length).toBeGreaterThan(0);
  });

  test('rejects a matrix whose diagonal is not 1', () => {
    const matrix = [
      [2, 2],
      [1 / 2, 1],
    ];
    expect(validationService.validateMatrix(matrix, 'crit').length).toBeGreaterThan(0);
  });

  test('rejects a matrix that violates the reciprocal property', () => {
    const matrix = [
      [1, 2],
      [2, 1], // should be 1/2 to be reciprocal
    ];
    expect(validationService.validateMatrix(matrix, 'crit').length).toBeGreaterThan(0);
  });
});

describe('validationService.checkConsistencyRatio', () => {
  test('CR at or below the 0.10 threshold is acceptable with no warnings', () => {
    const { isAcceptable, warnings } = validationService.checkConsistencyRatio(0.05);
    expect(isAcceptable).toBe(true);
    expect(warnings).toEqual([]);
  });

  test('CR above the 0.10 threshold is flagged', () => {
    const { isAcceptable, warnings } = validationService.checkConsistencyRatio(0.25);
    expect(isAcceptable).toBe(false);
    expect(warnings.length).toBe(1);
  });
});
