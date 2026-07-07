const ahpService = require('../src/services/ahpService');

describe('ahpService.calculateCR', () => {
  test('a perfectly consistent 3x3 matrix has CR = 0', () => {
    // Weights 4:2:1 -> perfectly consistent pairwise matrix
    const matrix = [
      [1, 2, 4],
      [1 / 2, 1, 2],
      [1 / 4, 1 / 2, 1],
    ];
    const { CR, weights } = ahpService.calculateCR(matrix);
    expect(CR).toBeCloseTo(0, 5);
    expect(weights.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 5);
  });

  test('a deliberately inconsistent 3x3 matrix exceeds the 0.10 CR threshold', () => {
    const matrix = [
      [1, 9, 1 / 9],
      [1 / 9, 1, 9],
      [9, 1 / 9, 1],
    ];
    const { CR } = ahpService.calculateCR(matrix);
    expect(CR).toBeGreaterThan(0.1);
  });

  test('matrices smaller than 3x3 are always perfectly consistent (CR = 0)', () => {
    const matrix = [
      [1, 3],
      [1 / 3, 1],
    ];
    const { CR } = ahpService.calculateCR(matrix);
    expect(CR).toBe(0);
  });
});

describe('ahpService.aggregateAIJ', () => {
  test('geometric-mean aggregation of two identical matrices returns the same matrix', () => {
    const matrix = [
      [1, 2],
      [1 / 2, 1],
    ];
    const result = ahpService.aggregateAIJ([matrix, matrix]);
    expect(result[0][1]).toBeCloseTo(2, 5);
    expect(result[1][0]).toBeCloseTo(0.5, 5);
  });
});

describe('ahpService fuzzy support', () => {
  test('fuzzifyValue(1) returns [1,1,1]', () => {
    expect(ahpService.fuzzifyValue(1)).toEqual([1, 1, 1]);
  });

  test('fuzzifyValue and defuzzifyMatrix round-trip stays close to the crisp input', () => {
    const crisp = [
      [1, 5],
      [1 / 5, 1],
    ];
    const fuzzy = ahpService.fuzzifyMatrix(crisp);
    const back = ahpService.defuzzifyMatrix(fuzzy);
    expect(back[0][1]).toBeCloseTo(5, 0);
  });
});
