const RI_TABLE = [0, 0, 0, 0.58, 0.9, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49, 1.51, 1.48, 1.56, 1.57, 1.59];

const getPriorities = (matrix) => {
  const n = matrix.length;
  if (!n) return [];

  const geo = matrix.map(row => {
    const prod = row.reduce((a, v) => a * (v > 0 ? v : 1e-9), 1);
    return Math.pow(prod, 1 / n);
  });

  const sum = geo.reduce((a, b) => a + b, 0) || 1;
  return geo.map(g => g / sum);
};

const getLambdaMax = (matrix, w) => {
  const n = matrix.length;
  if (!n) return n;

  let sum = 0;
  for (let i = 0; i < n; i++) {
    const row = matrix[i];
    let aw = 0;
    for (let j = 0; j < n; j++) aw += row[j] * w[j];
    sum += aw / (w[i] || 1e-9);
  }

  return sum / n;
};

const calculateCR = (matrix) => {
  const n = matrix.length;
  if (n < 3) return { CR: 0, CI: 0, weights: getPriorities(matrix) };

  const w = getPriorities(matrix);
  const lambda = getLambdaMax(matrix, w);
  const CI = (lambda - n) / (n - 1);
  const RI = RI_TABLE[n] || 1.59;
  // Clamp tiny negative FP noise to 0 — there is no "negative inconsistency".
  const CR = Math.max(0, CI / RI);

  return { CR, CI, lambda, weights: w };
};

const aggregateAIJ = (matricesByExpert, weights) => {
  if (!matricesByExpert.length) return [];

  const n = matricesByExpert[0].length;
  const out = Array.from({ length: n }, () => Array(n).fill(1));

  // Weighted geometric mean when expert weights supplied (case_experts.weight);
  // falls back to plain geometric mean otherwise. TFN cells are defuzzified
  // by centroid so mixed crisp/fuzzy expert sets don't produce NaN.
  const crispOf = (v) => (Array.isArray(v) ? (v[0] + v[1] + v[2]) / 3 : v);
  let norm = null;
  if (Array.isArray(weights) && weights.length === matricesByExpert.length) {
    const sum = weights.reduce((a, b) => a + (b > 0 ? b : 0), 0);
    if (sum > 0) norm = weights.map(w => (w > 0 ? w : 0) / sum);
  }

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (norm) {
        let logSum = 0;
        for (let k = 0; k < matricesByExpert.length; k++) {
          logSum += norm[k] * Math.log(Math.max(crispOf(matricesByExpert[k][i][j]), 1e-9));
        }
        out[i][j] = Math.exp(logSum);
      } else {
        const prod = matricesByExpert.reduce((p, M) => p * Math.max(crispOf(M[i][j]), 1e-9), 1);
        out[i][j] = Math.pow(prod, 1 / matricesByExpert.length);
      }
    }
  }

  return out;
};

// ============================================================
// FUZZY AHP SUPPORT
// ============================================================

// TFN operations (Triangular Fuzzy Numbers)
const tfnMul = (a, b) => [a[0] * b[0], a[1] * b[1], a[2] * b[2]];
const tfnAdd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const tfnInv = (a) => [1 / a[2], 1 / a[1], 1 / a[0]];

// Fuzzy aggregation (weighted geometric mean of TFN matrices)
const aggregateFuzzyAIJ = (tfnMatricesByExpert, weights) => {
  if (!tfnMatricesByExpert.length) return [];

  const n = tfnMatricesByExpert[0].length;
  const numExperts = tfnMatricesByExpert.length;
  const out = Array.from({ length: n }, () => Array(n).fill([1, 1, 1]));

  let norm = null;
  if (Array.isArray(weights) && weights.length === numExperts) {
    const sum = weights.reduce((a, b) => a + (b > 0 ? b : 0), 0);
    if (sum > 0) norm = weights.map(w => (w > 0 ? w : 0) / sum);
  }

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      // Weighted geometric mean of TFN values: exp(sum w_k * ln(v_k)).
      // Crisp cells in mixed sets are treated as degenerate [v,v,v].
      let lSum = 0, mSum = 0, uSum = 0;
      for (let k = 0; k < numExperts; k++) {
        const raw = tfnMatricesByExpert[k][i][j];
        const tfn = Array.isArray(raw) ? raw : [raw, raw, raw];
        const w = norm ? norm[k] : 1 / numExperts;
        lSum += w * Math.log(Math.max(tfn[0], 1e-9));
        mSum += w * Math.log(Math.max(tfn[1], 1e-9));
        uSum += w * Math.log(Math.max(tfn[2], 1e-9));
      }
      out[i][j] = [Math.exp(lSum), Math.exp(mSum), Math.exp(uSum)];
    }
  }

  return out;
};

// Fuzzy priorities using Chang's extent analysis (simplified)
const fuzzyPriorities = (tfnMatrix) => {
  const n = tfnMatrix.length;
  if (!n) return [];

  // Row-sum of TFN values
  const rowSums = tfnMatrix.map((row) => {
    return row.reduce((acc, tfn) => tfnAdd(acc, tfn), [0, 0, 0]);
  });

  // Total sum
  const total = rowSums.reduce((acc, tfn) => tfnAdd(acc, tfn), [0, 0, 0]);
  const totalInv = tfnInv(total);

  // S_i = row_sum * total_inv
  const S = rowSums.map((r) => tfnMul(r, totalInv));

  // Defuzzify using centroid method: (l + m + u) / 3
  const centroids = S.map((s) => (s[0] + s[1] + s[2]) / 3);

  // Normalize
  const sum = centroids.reduce((a, b) => a + b, 0) || 1;
  return centroids.map((c) => c / sum);
};

// Defuzzify TFN matrix to crisp for CR calculation
const defuzzifyMatrix = (tfnMatrix) => {
  return tfnMatrix.map((row) => row.map((tfn) => (tfn[0] + tfn[1] + tfn[2]) / 3));
};

// Convert a crisp Saaty value into TFN [l, m, u] (standard triangular fuzzification)
const fuzzifyValue = (x) => {
  if (x === 1) return [1, 1, 1];
  if (x > 1) return [Math.max(1, x - 1), x, Math.min(9, x + 1)];
  // Reciprocal value (< 1): fuzzify its inverse, then invert the TFN
  const inv = 1 / x;
  const tfn = [Math.max(1, inv - 1), inv, Math.min(9, inv + 1)];
  return [1 / tfn[2], 1 / tfn[1], 1 / tfn[0]];
};

// Convert a crisp matrix to TFN matrix; leaves cells that are already TFN untouched
const fuzzifyMatrix = (matrix) =>
  matrix.map((row) => row.map((v) => (Array.isArray(v) ? v : fuzzifyValue(v))));

// ============================================================
// ANP (Analytic Network Process) SUPPORT
// ============================================================

// Build supermatrix from aggregated judgments and dependencies
// idToIndex maps criteria server IDs -> matrix indices (built by the caller
// from the ordered criteria list). Without it, dependencies can't be mapped
// and the function honestly falls back to AHP weights.
const buildSupermatrix = (aggregatedMatrix, dependencies, n, idToIndex) => {
  // If no dependencies, return standard AHP weights
  if (!dependencies || dependencies.length === 0) {
    return getPriorities(aggregatedMatrix);
  }

  if (!idToIndex) return getPriorities(aggregatedMatrix);
  return calculateANPWeights(aggregatedMatrix, dependencies, 5, idToIndex);
};

// Calculate ANP priorities with network iterations.
// Dependencies are { from_criteria_id, to_criteria_id } (or { from, to });
// idToIndex maps those IDs to matrix indices.
const calculateANPWeights = (aggregatedMatrix, dependencies, iterations = 5, idToIndex = null) => {
  const n = aggregatedMatrix.length;
  const baseWeights = getPriorities(aggregatedMatrix);

  // If no dependencies, return standard weights
  if (!dependencies || dependencies.length === 0) {
    return baseWeights;
  }

  // Build influence matrix: identity (self) + directed edges.
  const influences = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
  );
  let mapped = 0;
  dependencies.forEach((dep) => {
    const fromKey = dep.from_criteria_id ?? dep.from;
    const toKey = dep.to_criteria_id ?? dep.to;
    const fromIdx = idToIndex ? idToIndex.get(String(fromKey)) : undefined;
    const toIdx = idToIndex ? idToIndex.get(String(toKey)) : undefined;
    if (fromIdx !== undefined && toIdx !== undefined && fromIdx !== toIdx) {
      influences[toIdx][fromIdx] += 1;
      mapped++;
    }
  });

  // No mappable edges -> honest AHP fallback (don't fake network effect).
  if (mapped === 0) return baseWeights;

  // Column-normalize influence matrix, then iterate to steady state.
  for (let j = 0; j < n; j++) {
    const colSum = influences.reduce((s, row) => s + row[j], 0) || 1;
    for (let i = 0; i < n; i++) influences[i][j] /= colSum;
  }

  let weights = [...baseWeights];
  for (let iter = 0; iter < iterations; iter++) {
    const next = Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) next[i] += influences[i][j] * weights[j];
    }
    const sum = next.reduce((a, b) => a + b, 0) || 1;
    weights = next.map((w) => w / sum);
  }

  return weights;
};

module.exports = {
  calculateCR,
  getPriorities,
  aggregateAIJ,
  // Fuzzy support
  tfnMul,
  tfnAdd,
  tfnInv,
  aggregateFuzzyAIJ,
  fuzzyPriorities,
  defuzzifyMatrix,
  fuzzifyValue,
  fuzzifyMatrix,
  // ANP support
  buildSupermatrix,
  calculateANPWeights,
};
