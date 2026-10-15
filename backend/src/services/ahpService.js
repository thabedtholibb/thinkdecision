const RI_TABLE = [0, 0, 0, 0.58, 0.9, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49, 1.51, 1.48, 1.56, 1.57, 1.59];

const EIGEN_TOL = 1e-12;
const EIGEN_MAX_ITER = 1000;

// Row geometric mean. Exact for consistent matrices; used as the starting
// vector of the power method below.
const rgmmPriorities = (matrix) => {
  const n = matrix.length;
  if (!n) return [];

  const geo = matrix.map(row => {
    const prod = row.reduce((a, v) => a * (v > 0 ? v : 1e-9), 1);
    return Math.pow(prod, 1 / n);
  });

  const sum = geo.reduce((a, b) => a + b, 0) || 1;
  return geo.map(g => g / sum);
};

// Principal right eigenvector (Saaty's eigenvector method) by power iteration.
// A positive reciprocal matrix is primitive, so the iteration converges.
const getPriorities = (matrix) => {
  const n = matrix.length;
  let w = rgmmPriorities(matrix);
  for (let k = 0; k < EIGEN_MAX_ITER && n > 1; k++) {
    const next = matrix.map(row => row.reduce((s, v, j) => s + v * w[j], 0));
    const sum = next.reduce((a, b) => a + b, 0) || 1;
    let diff = 0;
    for (let i = 0; i < n; i++) {
      next[i] /= sum;
      diff = Math.max(diff, Math.abs(next[i] - w[i]));
    }
    w = next;
    if (diff < EIGEN_TOL) break;
  }
  return w;
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

// Fuzzy priorities by Buckley's (1985) fuzzy geometric mean. Chang's extent
// analysis is avoided because it can assign zero weights (Wang et al., 2008).
const fuzzyPriorities = (tfnMatrix) => {
  const n = tfnMatrix.length;
  if (!n) return [];

  // r_i = (prod_j a_ij)^(1/n), component-wise on (l, m, u)
  const r = tfnMatrix.map((row) =>
    [0, 1, 2].map((k) => Math.pow(row.reduce((p, tfn) => p * tfn[k], 1), 1 / n))
  );

  // w_i = r_i ⊗ (sum_k r_k)^-1
  const totalInv = tfnInv(r.reduce((acc, tfn) => tfnAdd(acc, tfn), [0, 0, 0]));
  const S = r.map((ri) => tfnMul(ri, totalInv));

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

const matMul = (A, B) => A.map(row => B[0].map((_, j) => row.reduce((s, v, k) => s + v * B[k][j], 0)));
const maxAbsDiff = (A, B) => Math.max(...A.map((row, i) => Math.max(...row.map((v, j) => Math.abs(v - B[i][j])))));

// Limit of a column-stochastic supermatrix: W^k until consecutive powers agree.
// If the powers cycle (period p), return the Cesàro mean of one cycle (Saaty, 2001).
const limitSupermatrix = (W, tol = 1e-10, maxIter = 10000) => {
  const N = W.length;
  const hist = [W];
  for (let k = 1; k < maxIter; k++) {
    const next = matMul(hist[hist.length - 1], W);
    if (maxAbsDiff(next, hist[hist.length - 1]) < tol) return { limit: next, iterations: k + 1, period: 1 };
    hist.push(next);
    if (hist.length > N + 1) hist.shift();
    for (let p = 2; p < hist.length; p++) {
      if (maxAbsDiff(next, hist[hist.length - 1 - p]) < tol) {
        const cycle = hist.slice(-p);
        const mean = W.map((row, i) => row.map((_, j) => cycle.reduce((s, M) => s + M[i][j], 0) / p));
        return { limit: mean, iterations: k + 1, period: p };
      }
    }
  }
  throw new Error('Supermatrix did not converge');
};

// ANP for a goal -> criteria -> alternatives network with inner dependence
// among criteria (Saaty & Takizawa, 1986; Saaty, 2001). Supermatrix order:
// [goal, criteria (n), alternatives (m)].
//   critWeights   n-vector, criteria w.r.t. the goal
//   innerDep      n×n; column j = priorities of the criteria compared with
//                 respect to criterion j (sums to 1), or all zeros if j has none
//   altLocal      n arrays of m, alternatives w.r.t. each criterion
//   clusterWeight weight of the criteria cluster in a criterion column that has
//                 inner dependence; the alternatives cluster gets the rest
// Alternatives are sinks with an identity block, so the limit's goal column holds
// the overall alternative priorities.
// ponytail: one cluster weight for every column; per-column cluster comparisons
// (full Super Decisions model) are the upgrade path if users need them.
const anpSynthesis = (critWeights, innerDep, altLocal, clusterWeight = 0.5) => {
  const n = critWeights.length;
  const m = altLocal[0]?.length || 0;
  const a = Math.min(Math.max(clusterWeight, 0.01), 0.99);
  // Columns without inner dependence give their whole weight to the alternatives.
  const aj = innerDep[0].map((_, j) => (innerDep.some(row => row[j] > 0) ? a : 0));
  const N = 1 + n + m;
  const zero = () => Array.from({ length: N }, () => Array(N).fill(0));
  const unweighted = zero();
  const weighted = zero();
  for (let i = 0; i < n; i++) unweighted[1 + i][0] = weighted[1 + i][0] = critWeights[i];
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      unweighted[1 + i][1 + j] = innerDep[i][j];
      weighted[1 + i][1 + j] = aj[j] * innerDep[i][j];
    }
    for (let k = 0; k < m; k++) {
      unweighted[1 + n + k][1 + j] = altLocal[j][k];
      weighted[1 + n + k][1 + j] = (1 - aj[j]) * altLocal[j][k];
    }
  }
  for (let k = 0; k < m; k++) unweighted[1 + n + k][1 + n + k] = weighted[1 + n + k][1 + n + k] = 1;

  const { limit, iterations, period } = limitSupermatrix(weighted);
  const alt = Array.from({ length: m }, (_, k) => limit[1 + n + k][0]);
  const altSum = alt.reduce((s, v) => s + v, 0) || 1;

  // Effective criteria weights c_j ∝ (1-a_j)·[Σ_k (W_CC)^k w]_j, so that
  // alt = Σ_j c_j·altLocal_j exactly (used for sensitivity analysis).
  const reach = Array(n).fill(0);
  let v = [...critWeights];
  for (let it = 0; it < 10000 && Math.max(...v) > 1e-15; it++) {
    for (let i = 0; i < n; i++) reach[i] += v[i];
    v = innerDep.map((row, i) => row.reduce((s, x, j) => s + aj[j] * x * v[j], 0));
  }
  const c = reach.map((r, j) => (1 - aj[j]) * r);
  const cSum = c.reduce((s, x) => s + x, 0) || 1;

  return {
    criteriaWeights: c.map(x => x / cSum),
    alternativeScores: alt.map(x => x / altSum),
    supermatrix: { unweighted, weighted, limit, clusterWeight: a, iterations, period },
  };
};

module.exports = {
  calculateCR,
  getPriorities,
  rgmmPriorities,
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
  limitSupermatrix,
  anpSynthesis,
};
