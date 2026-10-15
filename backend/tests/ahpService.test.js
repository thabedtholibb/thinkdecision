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

  test('eigenvector method on the canonical Saaty 3x3 example', () => {
    const matrix = [
      [1, 3, 5],
      [1 / 3, 1, 3],
      [1 / 5, 1 / 3, 1],
    ];
    const { CR, weights } = ahpService.calculateCR(matrix);
    expect(weights[0]).toBeCloseTo(0.6370, 3);
    expect(weights[1]).toBeCloseTo(0.2583, 3);
    expect(weights[2]).toBeCloseTo(0.1047, 3);
    expect(CR).toBeCloseTo(0.0332, 3);
  });

  test('eigenvector method on a deliberately inconsistent 4x4 matrix', () => {
    const matrix = [
      [1, 3, 1 / 5, 7],
      [1 / 3, 1, 5, 1 / 3],
      [5, 1 / 5, 1, 9],
      [1 / 7, 3, 1 / 9, 1],
    ];
    const { CR, weights } = ahpService.calculateCR(matrix);
    expect(weights[0]).toBeCloseTo(0.2525, 3);
    expect(weights[1]).toBeCloseTo(0.2696, 3);
    expect(weights[2]).toBeCloseTo(0.3514, 3);
    expect(weights[3]).toBeCloseTo(0.1265, 3);
    expect(CR).toBeCloseTo(1.4766, 3);
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

  test('Buckley fuzzy geometric mean on the fuzzified Saaty 3x3 example', () => {
    const crisp = [
      [1, 3, 5],
      [1 / 3, 1, 3],
      [1 / 5, 1 / 3, 1],
    ];
    const weights = ahpService.fuzzyPriorities(ahpService.fuzzifyMatrix(crisp));
    expect(weights[0]).toBeCloseTo(0.6295, 3);
    expect(weights[1]).toBeCloseTo(0.2632, 3);
    expect(weights[2]).toBeCloseTo(0.1073, 3);
  });

  test('Buckley never yields a zero weight on a matrix where Chang\'s extent analysis would', () => {
    // Strongly-dominated TFN matrix: classic case where Chang's degree-of-
    // possibility step zeroes out the weakest criterion (Wang et al., 2008).
    const tfnMatrix = [
      [[1, 1, 1], [4, 5, 6], [6, 7, 8]],
      [[1 / 6, 1 / 5, 1 / 4], [1, 1, 1], [2, 3, 4]],
      [[1 / 8, 1 / 7, 1 / 6], [1 / 4, 1 / 3, 1 / 2], [1, 1, 1]],
    ];
    const weights = ahpService.fuzzyPriorities(tfnMatrix);
    expect(weights.every(w => w > 0)).toBe(true);
  });
});

describe('ahpService.anpSynthesis', () => {
  const critWeights = [0.5, 0.3, 0.2];
  const altLocal = [[0.6, 0.4], [0.3, 0.7], [0.5, 0.5]];

  test('zero inner dependence reduces to the plain AHP weighted sum', () => {
    const innerDep = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    const { criteriaWeights, alternativeScores } = ahpService.anpSynthesis(critWeights, innerDep, altLocal);
    expect(criteriaWeights).toEqual(critWeights);
    const expectedSum = altLocal[0].map((_, k) => critWeights.reduce((s, w, j) => s + w * altLocal[j][k], 0));
    const expectedNorm = expectedSum.map(x => x / expectedSum.reduce((a, b) => a + b, 0));
    alternativeScores.forEach((s, k) => expect(s).toBeCloseTo(expectedNorm[k], 5));
  });

  test('a 2-criterion inner-dependence cycle redistributes criteria weight correctly', () => {
    const innerDep = [[0, 1, 0], [1, 0, 0], [0, 0, 0]];
    const { criteriaWeights, alternativeScores } = ahpService.anpSynthesis(critWeights, innerDep, altLocal);
    expect(alternativeScores[0]).toBeCloseTo(0.47, 2);
    expect(alternativeScores[1]).toBeCloseTo(0.53, 2);
    // Effective criteria weights must reproduce the same alternative scores
    // via the plain weighted sum (used by sensitivity analysis).
    const reconstructed = altLocal[0].map((_, k) => criteriaWeights.reduce((s, c, j) => s + c * altLocal[j][k], 0));
    reconstructed.forEach((s, k) => expect(s).toBeCloseTo(alternativeScores[k], 5));
  });
});

describe('ahpService.limitSupermatrix', () => {
  test('a 2-cycle permutation matrix returns the Cesàro mean with period 2', () => {
    const W = [[0, 1], [1, 0]];
    const { limit, period } = ahpService.limitSupermatrix(W);
    expect(period).toBe(2);
    expect(limit[0][0]).toBeCloseTo(0.5, 5);
    expect(limit[0][1]).toBeCloseTo(0.5, 5);
    expect(limit[1][0]).toBeCloseTo(0.5, 5);
    expect(limit[1][1]).toBeCloseTo(0.5, 5);
  });
});

describe('synthesisService.synthesize', () => {
  const synthesisService = require('../src/services/synthesisService');

  test('AIJ synthesis without dependencies matches a plain AHP weighted sum', () => {
    const topCriteria = [{ id: 'c1', name: 'A' }, { id: 'c2', name: 'B' }];
    const critMatrix = [[1, 2], [1 / 2, 1]];
    const altMatrix1 = [[1, 3], [1 / 3, 1]];
    const altMatrix2 = [[1, 1 / 4], [4, 1]];
    const byLevel = {
      crit: [{ matrix: critMatrix, weight: 1 }],
      'alt-c1': [{ matrix: altMatrix1, weight: 1 }],
      'alt-c2': [{ matrix: altMatrix2, weight: 1 }],
    };
    const result = synthesisService.synthesize(byLevel, { topCriteria, nAlt: 2, isFuzzy: false, isANP: false, dependencies: [] });
    expect(result.criteriaWeights.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 5);
    expect(result.alternativeScores.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 5);
    expect(result.localAlternativeWeights.length).toBe(2);
    expect(result.levelConsistency.find(l => l.levelId === 'crit')).toBeTruthy();
    expect(result.supermatrix).toBeUndefined();
  });
});
