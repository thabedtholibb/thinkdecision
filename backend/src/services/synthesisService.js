const ahpService = require('./ahpService');

// AIJ for one comparison level: weighted geometric mean of the expert
// matrices, then eigenvector (crisp) or Buckley fuzzy geometric mean.
const levelPriorities = (entries, isFuzzy) => {
  const mats = entries.map(e => e.matrix);
  const wts = entries.map(e => e.weight);
  if (isFuzzy) {
    const agg = ahpService.aggregateFuzzyAIJ(mats.map(m => ahpService.fuzzifyMatrix(m)), wts);
    return { weights: ahpService.fuzzyPriorities(agg), cr: ahpService.calculateCR(ahpService.defuzzifyMatrix(agg)).CR };
  }
  const { weights, CR } = ahpService.calculateCR(ahpService.aggregateAIJ(mats, wts));
  return { weights, cr: CR };
};

// Full synthesis for a set of judgments grouped by level id:
//   'crit' criteria vs goal, 'alt-<critId>' alternatives vs criterion,
//   'sub-<critId>' sub-criteria (reported only), 'dep-<critId>' (ANP) the
//   criteria that influence <critId>, compared w.r.t. their influence on it.
const synthesize = (byLevel, { topCriteria, nAlt, isFuzzy, isANP, dependencies }) => {
  const level = {};
  Object.entries(byLevel).forEach(([id, entries]) => { level[id] = levelPriorities(entries, isFuzzy); });
  const n = topCriteria.length;
  const critW = level.crit?.weights || Array(n).fill(1 / (n || 1));
  const localAlt = topCriteria.map(c => level[`alt-${c.id}`]?.weights || Array(nAlt).fill(0));

  let criteriaWeights = critW;
  let alternativeScores = Array.from({ length: nAlt }, (_, k) => localAlt.reduce((s, w, j) => s + critW[j] * (w[k] || 0), 0));
  let supermatrix;

  if (isANP && n > 0 && nAlt > 0 && (dependencies || []).length > 0) {
    const idx = new Map(topCriteria.map((c, i) => [String(c.id), i]));
    const innerDep = Array.from({ length: n }, () => Array(n).fill(0));
    topCriteria.forEach((c, j) => {
      const influencers = topCriteria
        .map((x, i) => i)
        .filter(i => dependencies.some(d => idx.get(String(d.from_criteria_id)) === i && idx.get(String(d.to_criteria_id)) === j && i !== j));
      if (!influencers.length) return;
      const w = influencers.length === 1 ? [1] : (level[`dep-${c.id}`]?.weights || influencers.map(() => 1 / influencers.length));
      influencers.forEach((i, k) => { innerDep[i][j] = w[k] || 0; });
    });
    const anp = ahpService.anpSynthesis(critW, innerDep, localAlt);
    criteriaWeights = anp.criteriaWeights;
    alternativeScores = anp.alternativeScores;
    supermatrix = anp.supermatrix;
  }

  const label = (id) => id === 'crit' ? 'Kriteria' : id.startsWith('alt-') ? 'Alternatif' : id.startsWith('sub-') ? 'Sub-kriteria' : id.startsWith('dep-') ? 'Dependensi' : id;
  const nameOf = (id) => topCriteria.find(c => String(c.id) === id.slice(4))?.name;
  return {
    criteriaWeights,
    alternativeScores,
    localAlternativeWeights: topCriteria.map((c, j) => ({ criterionId: c.id, weights: localAlt[j] })),
    levelConsistency: Object.keys(level).sort().map(id => ({
      levelId: id,
      label: id === 'crit' ? label(id) : `${label(id)} · ${nameOf(id) || id}`,
      cr: level[id].cr,
    })),
    supermatrix,
  };
};

module.exports = { levelPriorities, synthesize };
