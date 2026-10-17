const express = require('express');
const Joi = require('joi');
const authenticate = require('../middleware/authenticate');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const supabase = require('../config/supabase');
const ahpService = require('../services/ahpService');
const { synthesize } = require('../services/synthesisService');
const cacheService = require('../services/cacheService');
const { AppError } = require('../middleware/errorHandler');
const caseService = require('../services/caseService');
const methods = require('../services/methods');
const ism = require('../services/methods/ism');
const micmac = require('../services/methods/micmac');

const router = express.Router({ mergeParams: true });

const sensitivitySchema = Joi.object({
  criteriaWeightOverrides: Joi.object().pattern(Joi.string(), Joi.number().min(0).max(1)).optional(),
});

// Demo-only placeholder case IDs — not real records, no ownership to check.
const DEMO_CASE_IDS = new Set(['erp-vendor']);

// Results expose other experts' judgments, so only the case creator may read
// them; invited experts stay blind until the creator shares the outcome.
const assertCreatorAccess = async (caseId, userId) => {
  const access = await caseService.assertCaseAccess(caseId, userId);
  if (access.role !== 'creator') {
    throw new AppError('Hasil hanya dapat diakses oleh pembuat kasus', 403, 'RESULTS_CREATOR_ONLY');
  }
  return access;
};

const RANKING_SHAPES = ['ranking', 'network_ranking'];

// Sensitivity/discrepancy only make sense for ranking results (422 otherwise).
const assertRankingMethod = (method, analysisLabel) => {
  const meta = methods.get(method)?.meta;
  if (meta && !RANKING_SHAPES.includes(meta.result_shape)) {
    throw new AppError(`${analysisLabel} tidak tersedia untuk metode ${meta.code}`, 422, 'UNSUPPORTED_FOR_METHOD');
  }
};

// ISM: computed on read from submitted 'structure' judgments.
const buildIsmResult = async (caseData) => {
  const caseId = caseData.id;
  const [{ data: elements }, { data: experts }, { data: rows }, { data: cfgRow }] = await Promise.all([
    supabase.from('criteria').select('id,name').eq('case_id', caseId).order('id'),
    supabase.from('case_experts').select('expert_id, weight, status, users(name)').eq('case_id', caseId),
    supabase.from('judgments').select('expert_id, matrix, matrix_order')
      .eq('case_id', caseId).eq('level_id', ism.LEVEL_ID).eq('submitted', true),
    // method_config only exists after migration 2025100107 (error -> null).
    supabase.from('cases').select('method_config').eq('id', caseId).single(),
  ]);
  const expertById = new Map((experts || []).map((e) => [e.expert_id, e]));
  const submissions = (rows || []).filter((r) => expertById.has(r.expert_id)).map((r) => ({
    expert_id: r.expert_id,
    name: expertById.get(r.expert_id).users?.name || 'Pakar Tanpa Nama',
    order: r.matrix_order,
    comparisons: r.matrix,
  }));
  const payload = ism.computeResult(
    submissions,
    elements || [],
    submissions.map((s) => expertById.get(s.expert_id).weight || 1)
  );
  return {
    success: true,
    data: {
      caseId,
      method: 'ISM',
      result_shape: ism.meta.result_shape,
      status: caseService.resolveCaseStatus(caseData.status, experts, caseData.published_at),
      contextual_relation: cfgRow?.method_config?.contextual_relation || '',
      expertCount: (experts || []).length,
      completedExpertCount: submissions.length,
      elements: (elements || []).map((e) => ({ id: e.id, name: e.name })),
      payload,
      secondary: payload ? [{
        analysis_code: micmac.meta.code,
        result_shape: micmac.meta.result_shape,
        payload: micmac.fromReachability(payload.final_reachability, payload.element_order),
      }] : [],
    },
  };
};

router.get('/:caseId', authenticate, asyncHandler(async (req, res) => {
  const { caseId } = req.params;
  const method = req.query.method === 'AIP' ? 'AIP' : 'AIJ';

  if (!DEMO_CASE_IDS.has(caseId)) {
    // Real cases only: block anyone who isn't the creator or an invited
    // expert before touching cache or data (a cache hit must not leak
    // another case's results to an unauthorized caller either).
    await assertCreatorAccess(caseId, req.user.id);
  }

  const cacheKey = `${cacheService.getCacheKeys.caseResults(caseId)}:${method}`;

  // Try to get from cache
  const cached = await cacheService.get(cacheKey);
  if (cached) {
    console.log(`[Results] Cache HIT for ${caseId}`);
    return res.json(cached);
  }

  console.log(`[Results] Cache MISS for ${caseId}`);

  try {
    // Get case info (explicit columns — no matrix payloads here)
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('id,name,description,objective,method,status,deadline,published_at,created_at')
      .eq('id', caseId)
      .single();

    // If case not found, return mock waiting state for demo
    if (caseError || !caseData) {
      const mockCases = {
        'erp-vendor': {
          id: 'erp-vendor',
          name: 'Pemilihan Vendor ERP Terbaik',
          description: 'Evaluasi 4 vendor ERP untuk implementasi di unit Manufaktur PT Nusantara',
          method: 'AHP',
          status: 'active'
        }
      };

      if (mockCases[caseId]) {
        return res.json({
          success: true,
          status: 'waiting',
          data: {
            caseId,
            caseName: mockCases[caseId].name,
            method: mockCases[caseId].method,
            totalExperts: 4,
            completedExperts: 0,
            message: 'Menunggu penilaian dari pakar',
            criteria: [
              { id: 'c1', name: 'Harga', level: 1 },
              { id: 'c2', name: 'Kualitas', level: 1 },
              { id: 'c3', name: 'Support', level: 1 },
              { id: 'c4', name: 'Reputasi', level: 1 }
            ],
            alternatives: [
              { id: 'a1', name: 'SAP S/4HANA' },
              { id: 'a2', name: 'Oracle Fusion Cloud' },
              { id: 'a3', name: 'MS Dynamics 365' },
              { id: 'a4', name: 'Odoo Enterprise' }
            ],
          },
        });
      }

      return res.status(404).json({
        success: false,
        error: {
          code: 'CASE_NOT_FOUND',
          message: 'Case not found',
        },
      });
    }

    const methodMeta = methods.get(caseData.method)?.meta;
    caseData.method = methods.normalizeCode(caseData.method);
    if (methodMeta?.family === 'structural') {
      const ismResponse = await buildIsmResult(caseData);
      await cacheService.set(cacheKey, ismResponse, 3600);
      return res.json(ismResponse);
    }

    // Get all experts invited to this case
    const { data: allExperts, error: allExpertsError } = await supabase
      .from('case_experts')
      .select('expert_id, weight, status')
      .eq('case_id', caseId);

    // Get judgments to check who actually submitted (not just status field).
    // submitted=true is the source of truth — a saved draft must not count.
    const { data: allJudgments } = await supabase
      .from('judgments')
      .select('expert_id, submitted')
      .eq('case_id', caseId);

    const expertsWithJudgments = new Set(
      (allJudgments || []).filter(j => j.submitted).map(j => j.expert_id)
    );

    const totalExperts = allExperts?.length || 0;
    // Count experts who have submitted judgments (more reliable than status field)
    const completedCount = allExperts?.filter(e => expertsWithJudgments.has(e.expert_id)).length || 0;

    console.log('[Results] Case:', caseId, 'Total experts:', totalExperts, 'With judgments:', completedCount, 'Experts:', allExperts);

    // Get criteria and alternatives (explicit columns)
    const { data: criteria } = await supabase
      .from('criteria')
      .select('id,case_id,parent_criteria_id,name,description,level')
      .eq('case_id', caseId)
      .order('level', { ascending: true });

    const { data: alternatives } = await supabase
      .from('alternatives')
      .select('id,case_id,name')
      .eq('case_id', caseId);

    // Fetch dependencies if ANP method
    const isANP = methodMeta?.result_shape === 'network_ranking';
    let dependencies = [];
    if (isANP) {
      const { data: depsData } = await supabase
        .from('dependencies')
        .select('id,case_id,from_criteria_id,to_criteria_id')
        .eq('case_id', caseId);
      dependencies = depsData || [];
      console.log('[Results] ANP dependencies:', dependencies);
    }

    // If no completed judgments yet
    if (completedCount === 0) {
      return res.json({
        success: true,
        status: 'waiting',
        data: {
          caseId,
          caseName: caseData.name,
          method: caseData.method,
          totalExperts,
          completedExperts: 0,
          message: 'Menunggu penilaian dari pakar',
          criteria: criteria || [],
          alternatives: alternatives || [],
        },
      });
    }

    // Get all experts for this case (we'll filter by who has judgments)
    const { data: allExpertDetails } = await supabase
      .from('case_experts')
      .select(`
        expert_id,
        weight,
        status,
        users(id, name, email)
      `)
      .eq('case_id', caseId);

    // Filter to only experts who have submitted judgments
    const completedExperts = (allExpertDetails || []).filter(e =>
      expertsWithJudgments.has(e.expert_id)
    );

    console.log('[Results] Experts with judgments:', completedExperts);

    // Get judgments for each expert (explicit columns — matrix travels only here)
    const { data: judgments } = await supabase
      .from('judgments')
      .select('id,expert_id,level_id,matrix,submitted')
      .eq('case_id', caseId);

    console.log('[Results] Judgments found:', judgments?.length || 0, 'Data:', judgments);

    // Only submitted judgments count toward aggregation — drafts must not
    // skew results. Fall back to all rows only if the submitted flag is
    // absent on legacy data.
    const submittedJudgments = (judgments || []).filter(j => j.submitted);
    const effectiveJudgments = submittedJudgments.length > 0 ? submittedJudgments : (judgments || []);

    if (!judgments || judgments.length === 0) {
      console.log('[Results] No judgments found, returning waiting status');
      return res.json({
        success: true,
        status: 'waiting',
        data: {
          caseId,
          caseName: caseData.name,
          method: caseData.method,
          totalExperts,
          completedExperts: completedCount,
          message: 'Menunggu penilaian dari pakar',
          criteria: criteria || [],
          alternatives: alternatives || [],
        },
      });
    }

    // Group judgments by expert and level
    const expertMatrices = {};
    completedExperts.forEach(expert => {
      expertMatrices[expert.expert_id] = {};
    });

    console.log('[Results] Grouping judgments. Total judgments:', effectiveJudgments.length);
    effectiveJudgments.forEach(j => {
      if (j.expert_id in expertMatrices) {
        if (!expertMatrices[j.expert_id][j.level_id]) {
          expertMatrices[j.expert_id][j.level_id] = [];
        }
        expertMatrices[j.expert_id][j.level_id] = j.matrix;
        console.log('[Results] Stored matrix for expert:', j.expert_id, 'level:', j.level_id, 'matrix:', j.matrix);
      }
    });

    console.log('[Results] Expert matrices:', expertMatrices);

    const critLevelId = 'crit';
    const topCriteria = (criteria || []).filter(c => c.level === 1 || !c.parent_criteria_id);
    const isFuzzy = methodMeta?.judgment_shape === 'fuzzy_ratio_matrix';
    const ctx = { topCriteria, nAlt: (alternatives || []).length, isFuzzy, isANP, dependencies };

    // byLevel: { levelId: [{ matrix, weight }] } for the given experts
    const byLevelFor = (experts) => {
      const byLevel = {};
      experts.forEach(expert => {
        Object.entries(expertMatrices[expert.expert_id] || {}).forEach(([levelId, matrix]) => {
          (byLevel[levelId] = byLevel[levelId] || []).push({ matrix, weight: expert.weight || 1 });
        });
      });
      return byLevel;
    };

    let synth;
    if (method === 'AIP') {
      // AIP (Forman & Peniwati, 1998): each expert's own synthesis, then the
      // weighted arithmetic mean of the individual priority vectors.
      const individual = completedExperts.map(e => ({ w: e.weight || 1, s: synthesize(byLevelFor([e]), ctx) }));
      const total = individual.reduce((a, x) => a + x.w, 0) || 1;
      const mean = (pick) => pick(individual[0].s).map((_, i) =>
        individual.reduce((a, x) => a + x.w * (pick(x.s)[i] || 0), 0) / total);
      synth = {
        ...individual[0].s,
        criteriaWeights: mean(s => s.criteriaWeights),
        alternativeScores: mean(s => s.alternativeScores),
        localAlternativeWeights: individual[0].s.localAlternativeWeights.map((lw, j) => ({
          ...lw,
          weights: lw.weights.map((_, k) => individual.reduce((a, x) => a + x.w * (x.s.localAlternativeWeights[j].weights[k] || 0), 0) / total),
        })),
        levelConsistency: individual[0].s.levelConsistency.map((lv, i) => ({
          ...lv,
          cr: individual.reduce((a, x) => a + x.w * (x.s.levelConsistency[i]?.cr || 0), 0) / total,
        })),
        supermatrix: undefined,
      };
    } else {
      synth = synthesize(byLevelFor(completedExperts), ctx);
    }

    const alternativeScores = (alternatives || [])
      .map((a, idx) => ({ id: a.id, name: a.name, score: synth.alternativeScores[idx] || 0 }))
      .sort((a, b) => b.score - a.score)
      .map((a, idx) => ({ ...a, rank: idx + 1 }));

    // Get consistency ratios for all completed experts, every level — not
    // just 'crit' — so the creator can see where an expert was inconsistent
    // on sub-criteria or alternative comparisons, not only the top level.
    const { data: allCRs } = await supabase
      .from('consistency_ratios')
      .select('expert_id, level_id, cr')
      .eq('case_id', caseId);

    const crByExpert = {};
    const crByLevelByExpert = {};
    allCRs?.forEach(cr => {
      if (cr.level_id === critLevelId) crByExpert[cr.expert_id] = cr.cr;
      (crByLevelByExpert[cr.expert_id] = crByLevelByExpert[cr.expert_id] || {})[cr.level_id] = cr.cr;
    });

    // Build experts array with name, email, and CR
    const expertsArray = completedExperts?.map(expert => ({
      id: expert.expert_id,
      name: expert.users?.name || 'Pakar Tanpa Nama',
      email: expert.users?.email || '',
      weight: expert.weight || 1,
      cr: crByExpert[expert.expert_id] || 0,
      crByLevel: crByLevelByExpert[expert.expert_id] || {},
    })) || [];

    console.log('[Results] Experts array:', expertsArray);

    const response = {
      success: true,
      status: 'completed',
      data: {
        caseId,
        caseName: caseData.name,
        method: caseData.method,
        aggregationMethod: method,
        totalExperts,
        completedExperts: completedCount,
        experts: expertsArray,
        criteriaWeights: synth.criteriaWeights.map((w, i) => ({
          id: topCriteria[i]?.id,
          name: topCriteria[i]?.name,
          weight: w || 0,
        })),
        alternativeScores,
        // Local alternative priorities under each criterion; score = Σ w_c·local_c,
        // which lets the client re-rank for weight sensitivity analysis.
        localAlternativeWeights: synth.localAlternativeWeights,
        consistencyRatio: synth.levelConsistency.find(l => l.levelId === critLevelId)?.cr ?? null,
        levelConsistency: synth.levelConsistency,
        supermatrix: synth.supermatrix,
        recommendation: alternativeScores[0] || null,
      },
    };

    // Cache for 1 hour
    await cacheService.set(cacheKey, response, 3600);
    res.json(response);
  } catch (error) {
    console.error('[Results] Error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    });
  }
}));

// Sensitivity analysis endpoint
router.post('/:caseId/sensitivity', authenticate, validate(sensitivitySchema), asyncHandler(async (req, res) => {
  const { caseId } = req.params;
  const { criteriaWeightOverrides } = req.validatedBody;

  const { caseRecord } = await assertCreatorAccess(caseId, req.user.id);
  assertRankingMethod(caseRecord.method, 'Analisis sensitivitas');

  try {
    // Get case info (explicit columns)
    const { data: caseData } = await supabase
      .from('cases')
      .select('id,name,method,status')
      .eq('id', caseId)
      .single();

    if (!caseData) {
      return res.status(404).json({
        success: false,
        error: { message: 'Case not found' }
      });
    }

    // Get criteria (top level — same convention as GET handler)
    const { data: criteria } = await supabase
      .from('criteria')
      .select('id,case_id,name,level')
      .eq('case_id', caseId)
      .eq('level', 1)
      .order('id');

    // Get alternatives
    const { data: alternatives } = await supabase
      .from('alternatives')
      .select('id,case_id,name')
      .eq('case_id', caseId);

    // Get completed experts and their judgments
    const { data: completedExperts } = await supabase
      .from('case_experts')
      .select(`
        expert_id,
        weight,
        status,
        users(id, name, email)
      `)
      .eq('case_id', caseId)
      .eq('status', 'completed');

    const { data: judgments } = await supabase
      .from('judgments')
      .select('id,expert_id,level_id,matrix,submitted')
      .eq('case_id', caseId);

    if (!judgments || judgments.length === 0 || !completedExperts) {
      return res.json({
        success: true,
        status: 'waiting',
        data: { message: 'No completed judgments yet' }
      });
    }

    const methodMeta = methods.get(caseData.method)?.meta;
    const isFuzzy = methodMeta?.judgment_shape === 'fuzzy_ratio_matrix';
    const isANP = methodMeta?.result_shape === 'network_ranking';
    let dependencies = [];
    if (isANP) {
      const { data: depsData } = await supabase
        .from('dependencies')
        .select('id,case_id,from_criteria_id,to_criteria_id')
        .eq('case_id', caseId);
      dependencies = depsData || [];
    }

    // Group judgments by expert and level (submitted only) — same convention as GET handler.
    const expertMatrices = {};
    completedExperts.forEach(expert => {
      expertMatrices[expert.expert_id] = {};
    });

    const submittedOnly = (judgments || []).filter(j => j.submitted);
    (submittedOnly.length > 0 ? submittedOnly : (judgments || [])).forEach(j => {
      if (j.expert_id in expertMatrices) {
        if (!expertMatrices[j.expert_id][j.level_id]) {
          expertMatrices[j.expert_id][j.level_id] = [];
        }
        expertMatrices[j.expert_id][j.level_id] = j.matrix;
      }
    });

    // byLevel: { levelId: [{ matrix, weight }] } for the completed experts.
    const byLevel = {};
    completedExperts.forEach(expert => {
      Object.entries(expertMatrices[expert.expert_id] || {}).forEach(([levelId, matrix]) => {
        (byLevel[levelId] = byLevel[levelId] || []).push({ matrix, weight: expert.weight || 1 });
      });
    });

    // Same synthesis engine as the GET handler (AIJ, Buckley fuzzy, ANP included).
    const topCriteria = criteria || [];
    const baseline = synthesize(byLevel, { topCriteria, nAlt: (alternatives || []).length, isFuzzy, isANP, dependencies });
    const aggregatedCritWeights = baseline.criteriaWeights;
    const localAlt = baseline.localAlternativeWeights; // [{ criterionId, weights }]

    // Apply weight overrides
    const adjustedWeights = [...aggregatedCritWeights];
    if (criteriaWeightOverrides) {
      Object.entries(criteriaWeightOverrides).forEach(([critId, newWeight]) => {
        const critIdx = topCriteria.findIndex(c => c.id === critId);
        if (critIdx >= 0) {
          adjustedWeights[critIdx] = newWeight;
        }
      });

      // Normalize weights to sum to 1 (guard divide-by-zero)
      const sum = adjustedWeights.reduce((a, b) => a + b, 0);
      if (sum > 0) {
        adjustedWeights.forEach((_, i) => {
          adjustedWeights[i] /= sum;
        });
      }
    }

    // What-if synthesis: score[alt] = sum_c critW[c] * local_c[alt], the same
    // formula the frontend sensitivity re-rank uses against localAlternativeWeights.
    const synthScores = (critW) => (alternatives || []).map((alt, altIdx) => ({
      id: alt.id,
      name: alt.name,
      score: localAlt.reduce((s, lw, j) => s + (critW[j] || 0) * (lw.weights[altIdx] || 0), 0),
    }));

    const sensitivityScores = synthScores(adjustedWeights);

    // Baseline uses the same synthesis with unadjusted weights (previously
    // indexed criteria weights by alternative index — always wrong).
    const baselineScores = synthScores(aggregatedCritWeights);

    const sensitivityRanked = sensitivityScores
      .sort((a, b) => b.score - a.score)
      .map((alt, idx) => ({
        ...alt,
        rank: idx + 1,
        baselineRank: baselineScores.findIndex(b => b.id === alt.id) + 1
      }));

    const baselineRanked = baselineScores
      .sort((a, b) => b.score - a.score)
      .map((alt, idx) => ({
        ...alt,
        rank: idx + 1
      }));

    res.json({
      success: true,
      status: 'completed',
      data: {
        caseId,
        baselineWeights: criteria?.map((c, idx) => ({
          id: c.id,
          name: c.name,
          weight: aggregatedCritWeights[idx] || 0
        })),
        adjustedWeights: criteriaWeightOverrides ? criteria?.map((c, idx) => ({
          id: c.id,
          name: c.name,
          weight: adjustedWeights[idx] || 0
        })) : undefined,
        baselineRanking: baselineRanked,
        sensitivityRanking: sensitivityRanked,
        changes: sensitivityRanked.filter(alt => alt.rank !== alt.baselineRank)
      }
    });
  } catch (error) {
    console.error('Sensitivity analysis error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SENSITIVITY_ERROR', message: 'Internal server error' }
    });
  }
}));

// Expert Discrepancy Analysis endpoint
router.get('/:caseId/discrepancy', authenticate, asyncHandler(async (req, res) => {
  const { caseId } = req.params;
  const { caseRecord } = await assertCreatorAccess(caseId, req.user.id);
  assertRankingMethod(caseRecord.method, 'Analisis diskrepansi');

  try {
    console.log('[Discrepancy] Fetching expert discrepancy for case:', caseId);

    // Get completed experts with their data
    const { data: completedExperts } = await supabase
      .from('case_experts')
      .select(`
        expert_id,
        weight,
        status,
        users(id, name, email)
      `)
      .eq('case_id', caseId)
      .eq('status', 'completed');

    if (!completedExperts || completedExperts.length === 0) {
      return res.json({
        success: true,
        status: 'no_data',
        message: 'Belum ada expert yang menyelesaikan penilaian'
      });
    }

    // Get all judgments
    const { data: judgments } = await supabase
      .from('judgments')
      .select('id,expert_id,level_id,matrix,submitted')
      .eq('case_id', caseId);

    // Get consistency ratios
    const { data: allCRs } = await supabase
      .from('consistency_ratios')
      .select('expert_id, level_id, cr')
      .eq('case_id', caseId);

    // Get criteria
    const { data: criteria } = await supabase
      .from('criteria')
      .select('id,case_id,name,level')
      .eq('case_id', caseId)
      .order('level', { ascending: true });

    // Build expert data structure
    const expertMatrices = {};
    const expertCRs = {};

    completedExperts.forEach(expert => {
      expertMatrices[expert.expert_id] = {};
      expertCRs[expert.expert_id] = {};
    });

    // Populate matrices and CRs
    judgments?.forEach(j => {
      if (j.expert_id in expertMatrices) {
        expertMatrices[j.expert_id][j.level_id] = j.matrix;
      }
    });

    allCRs?.forEach(cr => {
      if (cr.expert_id in expertCRs) {
        expertCRs[cr.expert_id][cr.level_id] = cr.cr;
      }
    });

    // Get level IDs from judgments
    const levelIds = new Set();
    judgments?.forEach(j => levelIds.add(j.level_id));
    const critLevelId = Array.from(levelIds).find(id => String(id).startsWith('crit'));

    // Calculate weights for each expert at criteria level
    const expertWeights = {};
    completedExperts.forEach(expert => {
      const matrix = expertMatrices[expert.expert_id][critLevelId];
      if (matrix) {
        const weights = ahpService.calculateCR(matrix).weights;
        expertWeights[expert.expert_id] = weights;
      }
    });

    console.log('[Discrepancy] Expert weights:', expertWeights);

    // Calculate discrepancy metrics
    const numCriteria = criteria?.length || 0;
    const discrepancyMetrics = {
      expertCount: completedExperts.length,
      criteria: (criteria || []).map((c, idx) => {
        // Get all weights for this criteria across experts
        const weightsForCriteria = Object.values(expertWeights)
          .map(weights => weights?.[idx] || 0)
          .filter(w => w > 0);

        // Calculate statistics
        const mean = weightsForCriteria.length > 0
          ? weightsForCriteria.reduce((a, b) => a + b, 0) / weightsForCriteria.length
          : 0;

        const stdDev = weightsForCriteria.length > 1
          ? Math.sqrt(weightsForCriteria.reduce((sum, w) => sum + Math.pow(w - mean, 2), 0) / weightsForCriteria.length)
          : 0;

        const max = weightsForCriteria.length > 0 ? Math.max(...weightsForCriteria) : 0;
        const min = weightsForCriteria.length > 0 ? Math.min(...weightsForCriteria) : 0;
        const range = max - min;

        return {
          id: c.id,
          name: c.name,
          mean: mean,
          stdDev: stdDev,
          range: range,
          min: min,
          max: max,
          divergence: stdDev > 0.05 ? 'HIGH' : stdDev > 0.02 ? 'MEDIUM' : 'LOW'
        };
      }),

      experts: completedExperts.map(expert => {
        const weights = expertWeights[expert.expert_id] || [];
        const cr = expertCRs[expert.expert_id]?.[critLevelId] || 0;
        const isOutlier = cr > 0.15 || false; // Will be calculated more precisely

        return {
          id: expert.expert_id,
          name: expert.users?.name || 'Pakar Tanpa Nama',
          email: expert.users?.email || '',
          weight: expert.weight || 1,
          cr: cr,
          weights: weights,
          crStatus: cr <= 0.1 ? '✓ Konsisten' : cr <= 0.15 ? '⚠️ Marginal' : '✗ Inkonsisten',
          isOutlier: isOutlier,
          avatarColor: ['#10b981', '#6366f1', '#0ea5e9', '#f59e0b', '#ef4444'][completedExperts.indexOf(expert) % 5]
        };
      })
    };

    // Calculate expert-to-expert correlations (simplified)
    const expertCorrelations = {};
    const expertList = Object.keys(expertWeights);
    for (let i = 0; i < expertList.length; i++) {
      for (let j = i + 1; j < expertList.length; j++) {
        const exp1 = expertList[i];
        const exp2 = expertList[j];
        const w1 = expertWeights[exp1] || [];
        const w2 = expertWeights[exp2] || [];

        // Calculate Euclidean distance (simplified correlation)
        const distance = Math.sqrt(w1.reduce((sum, v, idx) => sum + Math.pow(v - (w2[idx] || 0), 2), 0));
        const correlation = 1 / (1 + distance); // Normalize to 0-1

        const key = `${exp1}-${exp2}`;
        expertCorrelations[key] = correlation;
      }
    }

    discrepancyMetrics.expertCorrelations = expertCorrelations;

    console.log('[Discrepancy] Metrics calculated:', discrepancyMetrics);

    res.json({
      success: true,
      status: 'completed',
      data: discrepancyMetrics
    });
  } catch (error) {
    console.error('Discrepancy analysis error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DISCREPANCY_ERROR',
        message: 'Internal server error'
      }
    });
  }
}));

module.exports = router;
// Exposed for unit testing only (no supabase/DB needed to exercise the gate).
module.exports.assertCreatorAccess = assertCreatorAccess;
