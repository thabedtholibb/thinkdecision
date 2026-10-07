// Interpretive Structural Modelling — pure functions only (no DB access).
// Matrices are n×n arrays of 0/1 indexed by an element order; R[i][j] = 1
// means "element i influences element j".

const meta = {
  code: 'ISM', label: 'ISM',
  description: 'Interpretive Structural Modelling: memetakan relasi pengaruh antar-elemen menjadi hierarki level.',
  family: 'structural', structure_tier: 'single_tier', judgment_shape: 'binary_relation_matrix',
  consistency_kind: 'consensus', result_shape: 'level_partition', max_elements: 40,
  is_selectable: true, derived_from: null, sort_order: 50,
};

const LEVEL_ID = 'structure';
const SYMBOLS = ['V', 'A', 'X', 'O'];
const KEY_RE = /^(\d+)-(\d+)$/;

const square = (n, fill) => Array.from({ length: n }, () => Array(n).fill(fill));

// Single-tier structure: 3..max_elements elements, no sub-criteria, no
// alternatives, no ANP dependencies. Returns a list of error messages.
const validateStructure = ({ criteria = [], alternatives = [], dependencies = [] } = {}) => {
  const errors = [];
  const n = (criteria || []).length;
  if (n < 3 || n > meta.max_elements) errors.push(`ISM membutuhkan 3-${meta.max_elements} elemen, diterima ${n}`);
  if ((criteria || []).some((c) => c.subs && c.subs.length > 0)) errors.push('ISM tidak mendukung sub-kriteria');
  if ((alternatives || []).length > 0) errors.push('ISM tidak memakai alternatif');
  if ((dependencies || []).length > 0) errors.push('ISM tidak memakai dependensi');
  return errors;
};

const allKeys = (n) => {
  const keys = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) keys.push(`${i}-${j}`);
  return keys;
};

// order: element ids (exact permutation of elementIds); comparisons: sparse
// upper triangle {"i-j": "V"|"A"|"X"|"O"} indexed by order.
// Returns { errors, missing }; missing is only filled when submit is true.
const validateComparisons = (order, comparisons, elementIds, { submit = false } = {}) => {
  const errors = [];
  const ids = (elementIds || []).map(String);
  const ord = Array.isArray(order) ? order.map(String) : null;
  if (!ord || ord.length !== ids.length || new Set(ord).size !== ord.length || !ord.every((id) => ids.includes(id))) {
    errors.push('order harus permutasi tepat dari id elemen case');
  }
  const n = ids.length;
  const isObj = comparisons && typeof comparisons === 'object' && !Array.isArray(comparisons);
  const entries = isObj ? Object.entries(comparisons) : [];
  if (entries.length === 0) errors.push('comparisons minimal berisi 1 sel');
  for (const [key, value] of entries) {
    const m = KEY_RE.exec(key);
    if (!m || Number(m[1]) >= Number(m[2]) || Number(m[2]) >= n) {
      errors.push(`kunci ${key} tidak valid (harus i-j dengan i < j < ${n})`);
    } else if (!SYMBOLS.includes(value)) {
      errors.push(`nilai ${key} harus salah satu dari V, A, X, O`);
    }
  }
  const missing = submit ? allKeys(n).filter((k) => !(isObj && SYMBOLS.includes(comparisons[k]))) : [];
  return { errors, missing };
};

// Sparse VAXO (indexed by its own order) -> initial reachability, diagonal 1.
const toReachability = (comparisons, n) => {
  const R = square(n, 0);
  for (let i = 0; i < n; i++) R[i][i] = 1;
  for (const [key, v] of Object.entries(comparisons || {})) {
    const [i, j] = key.split('-').map(Number);
    if (v === 'V' || v === 'X') R[i][j] = 1;
    if (v === 'A' || v === 'X') R[j][i] = 1;
  }
  return R;
};

// Weighted majority per cell: 1 iff the weight share voting 1 is > 0.5.
// Exactly 0.5 is a tie, decided 0 and recorded. score = share of
// off-diagonal cells on which every expert agrees.
const majorityVote = (matrices, weights = []) => {
  const n = matrices[0]?.length || 0;
  const w = matrices.map((_, k) => (weights[k] > 0 ? weights[k] : 1));
  const total = w.reduce((a, b) => a + b, 0);
  const matrix = square(n, 0);
  const ties = [];
  let unanimous = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) { matrix[i][j] = 1; continue; }
      const share = matrices.reduce((s, M, k) => s + (M[i][j] ? w[k] : 0), 0) / total;
      if (Math.abs(share - 0.5) < 1e-12) ties.push([i, j]);
      else if (share > 0.5) matrix[i][j] = 1;
      if (matrices.every((M) => M[i][j] === matrices[0][i][j])) unanimous++;
    }
  }
  return { matrix, ties, score: n > 1 ? unanimous / (n * (n - 1)) : 1 };
};

// Warshall transitive closure (returns a new matrix).
const transitiveClosure = (R) => {
  const T = R.map((row) => [...row]);
  const n = T.length;
  for (let k = 0; k < n; k++) {
    for (let i = 0; i < n; i++) {
      if (!T[i][k]) continue;
      for (let j = 0; j < n; j++) if (T[k][j]) T[i][j] = 1;
    }
  }
  return T;
};

// Level partition on a final (transitive) reachability matrix: an element is
// placed when its reachability set equals the intersection with its antecedent
// set. Returns arrays of element indices, level 1 (top) first.
const levelPartition = (R) => {
  let remaining = R.map((_, i) => i);
  const levels = [];
  while (remaining.length > 0) {
    const level = remaining.filter((i) => remaining.every((j) => !R[i][j] || R[j][i]));
    // Only reachable on non-transitive input; avoid an infinite loop.
    if (level.length === 0) { levels.push(remaining); break; }
    levels.push(level);
    remaining = remaining.filter((i) => !level.includes(i));
  }
  return levels;
};

// Direct edges [from, to] as index pairs: no self-loops, and an edge i->j is
// dropped when a path i->k->j exists through an element k outside the
// mutual-reach cycle of i or j (i.e. the edge is transitive).
const digraphEdges = (R) => {
  const n = R.length;
  const sameCycle = (a, b) => R[a][b] && R[b][a];
  const edges = [];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j || !R[i][j]) continue;
      const implied = R.some((_, k) => k !== i && k !== j && R[i][k] && R[k][j]
        && !sameCycle(k, i) && !sameCycle(k, j));
      if (!implied) edges.push([i, j]);
    }
  }
  return edges;
};

const toSsim = (R) => R.map((row, i) => row.map((_, j) => {
  if (j <= i) return null;
  if (R[i][j] && R[j][i]) return 'X';
  if (R[i][j]) return 'V';
  return R[j][i] ? 'A' : 'O';
}));

// submissions: [{ expert_id, name, order, comparisons }]; elements: [{ id }] in
// canonical order; weights parallel to submissions. Returns the
// level_partition payload (API contract section 5), or null without input.
const computeResult = (submissions, elements, weights = []) => {
  if (!submissions || submissions.length === 0) return null;
  const ids = elements.map((e) => String(e.id));
  const n = ids.length;
  // Each expert's indices refer to their own saved order; remap to canonical.
  const matrices = submissions.map((s) => {
    const own = toReachability(s.comparisons, n);
    const pos = (s.order || ids).map(String);
    const at = ids.map((id) => pos.indexOf(id));
    return at.map((p) => at.map((q) => own[p][q]));
  });
  const vote = majorityVote(matrices, weights);
  const final = transitiveClosure(vote.matrix);
  const transitiveCells = [];
  final.forEach((row, i) => row.forEach((v, j) => {
    if (v && !vote.matrix[i][j]) transitiveCells.push([i, j]);
  }));
  const offDiag = n * (n - 1) || 1;
  return {
    element_order: ids,
    consensus: { score: vote.score, ties: vote.ties, tie_rule: 'zero' },
    consensus_ssim: toSsim(vote.matrix),
    initial_reachability: vote.matrix,
    final_reachability: final,
    transitive_cells: transitiveCells,
    iterations: levelPartition(final).map((lv, k) => ({ level: k + 1, elements: lv.map((i) => ids[i]) })),
    digraph_edges: digraphEdges(final).map(([i, j]) => [ids[i], ids[j]]),
    expert_agreement: submissions.map((s, k) => {
      let same = 0;
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) if (i !== j && matrices[k][i][j] === vote.matrix[i][j]) same++;
      }
      return { expert_id: s.expert_id, name: s.name, score: same / offDiag };
    }),
  };
};

module.exports = {
  meta, LEVEL_ID, validateStructure, validateComparisons, toReachability, majorityVote,
  transitiveClosure, levelPartition, digraphEdges, computeResult,
};
