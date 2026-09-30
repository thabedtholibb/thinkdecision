const express = require('express');
const Joi = require('joi');
const authenticate = require('../middleware/authenticate');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const supabase = require('../config/supabase');
const ahpService = require('../services/ahpService');
const cacheService = require('../services/cacheService');
const caseService = require('../services/caseService');

const router = express.Router({ mergeParams: true });

const sensitivitySchema = Joi.object({
  criteriaWeightOverrides: Joi.object().pattern(Joi.string(), Joi.number().min(0).max(1)).optional(),
});

// Demo-only placeholder case IDs — not real records, no ownership to check.
const DEMO_CASE_IDS = new Set(['erp-vendor']);

router.get('/:caseId', authenticate, asyncHandler(async (req, res) => {
  const { caseId } = req.params;
  const method = req.query.method || 'AIJ';

  if (!DEMO_CASE_IDS.has(caseId)) {
    // Real cases only: block anyone who isn't the creator or an invited
    // expert before touching cache or data (a cache hit must not leak
    // another case's results to an unauthorized caller either).
    await caseService.assertCaseAccess(caseId, req.user.id);
  }

  const cacheKey = cacheService.getCacheKeys.caseResults(caseId);

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
    const isANP = caseData?.method && (caseData.method === 'ANP' || caseData.method === 'Fuzzy ANP');
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

    // Calculate results for each level - use actual level IDs from judgments
    const resultsPerLevel = {};
    const levelIds = new Set();
    effectiveJudgments.forEach(j => levelIds.add(j.level_id));

    console.log('[Results] Level IDs from judgments:', Array.from(levelIds));

    // Define level IDs BEFORE the loop (previously critLevelId was declared
    // after use -> ReferenceError TDZ crash on every ANP request).
    const critLevelId = Array.from(levelIds).find(id => String(id).startsWith('crit'));
    const altLevelIds = Array.from(levelIds).filter(id => String(id).startsWith('alt-'));
    // Top-level criteria order defines the matrix dimension for 'crit' and ANP mapping.
    const topCriteriaForANP = (criteria || []).filter(c => c.level === 1 || !c.parent_criteria_id);
    console.log('[Results] Criteria level:', critLevelId, 'Alternative levels:', altLevelIds);

    for (const levelId of levelIds) {
      const matricesForLevel = [];
      const expertWeights = [];

      completedExperts.forEach(expert => {
        if (expertMatrices[expert.expert_id][levelId]) {
          matricesForLevel.push(expertMatrices[expert.expert_id][levelId]);
          expertWeights.push(expert.weight || 1);
        }
      });

      console.log('[Results] Level', levelId, 'has', matricesForLevel.length, 'matrices');

      if (matricesForLevel.length > 0) {
        // Check if this is a fuzzy method
        const isFuzzy = caseData?.method && caseData.method.includes('Fuzzy');

        let aggregatedMatrix;
        let levelWeights;
        let levelCR;

        if (isFuzzy) {
          // Matrices are stored with TFN cells [l,m,u]; fuzzifyMatrix leaves
          // TFN cells untouched and only fuzzifies legacy crisp cells.
          const tfnMatrices = matricesForLevel.map((m) => ahpService.fuzzifyMatrix(m));
          const aggregatedFuzzyMatrix = ahpService.aggregateFuzzyAIJ(tfnMatrices, expertWeights);
          console.log('[Results] Aggregated fuzzy matrix for level', levelId, ':', aggregatedFuzzyMatrix);

          // Get fuzzy weights
          levelWeights = ahpService.fuzzyPriorities(aggregatedFuzzyMatrix);

          // For CR, defuzzify and calculate on crisp matrix
          const defuzzifiedMatrix = ahpService.defuzzifyMatrix(aggregatedFuzzyMatrix);
          const crResult = ahpService.calculateCR(defuzzifiedMatrix);
          levelCR = crResult.CR;
        } else {
          // For AHP/ANP, use weighted AIJ (expert weights from case_experts)
          aggregatedMatrix = ahpService.aggregateAIJ(matricesForLevel, expertWeights);
          console.log('[Results] Aggregated matrix for level', levelId, ':', aggregatedMatrix);

          const crResult = ahpService.calculateCR(aggregatedMatrix);
          levelCR = crResult.CR;

          // For ANP, apply network dependencies to weights
          if (isANP && levelId === critLevelId && dependencies.length > 0) {
            // Map server criteria IDs -> matrix indices from ordered top criteria
            const idToIndex = new Map(
              (topCriteriaForANP || []).map((c, idx) => [String(c.id), idx])
            );
            levelWeights = ahpService.calculateANPWeights(aggregatedMatrix, dependencies, 5, idToIndex);
            console.log('[Results] ANP weights with dependencies:', levelWeights);
          } else {
            levelWeights = crResult.weights;
          }
        }

        resultsPerLevel[levelId] = {
          weights: levelWeights,
          cr: levelCR,
          experts: expertWeights.length,
        };
        console.log('[Results] Level', levelId, 'weights:', levelWeights, 'CR:', levelCR);
      }
    }

    // Calculate alternative scores: weighted synthesis across ALL alt-* levels.
    // score[alt] = sum_critWeight[c] * altWeight_c[alt]. Single-level fallback
    // kept for legacy cases with one generic alt level.
    const altScores = {};
    alternatives?.forEach(alt => {
      altScores[alt.id] = 0;
    });

    const critWeightsForSynthesis = resultsPerLevel[critLevelId]?.weights || [];
    // Map top-level criteria order -> weight (criteria fetched ordered by level;
    // level 1 rows correspond to the 'crit' comparison dimension).
    const topCriteria = (criteria || []).filter(c => c.level === 1 || !c.parent_criteria_id);
    const altLevelEntries = altLevelIds
      .map(altId => {
        const critId = String(altId).slice(4);
        const critIdx = topCriteria.findIndex(c => String(c.id) === critId);
        return { altId, critIdx };
      });

    console.log('[Results] Synthesis: topCriteria', topCriteria.map(c => c.id), 'entries', altLevelEntries);

    if (altLevelEntries.length > 0 && topCriteria.length > 0) {
      alternatives?.forEach((alt, altIdx) => {
        let score = 0;
        let weightSum = 0;
        altLevelEntries.forEach(({ altId, critIdx }) => {
          const w = resultsPerLevel[altId]?.weights?.[altIdx];
          // If alt level can't be mapped to a criterion (legacy 'alt-x'),
          // fall back to even split across criteria.
          const cw = critIdx >= 0
            ? (critWeightsForSynthesis[critIdx] || 0)
            : 1 / altLevelEntries.length;
          if (typeof w === 'number') {
            score += cw * w;
            weightSum += cw;
          }
        });
        altScores[alt.id] = score;
      });
      // Fallback: if no weights resolved (all undefined), use first alt level directly
      const allZero = Object.values(altScores).every(v => v === 0);
      if (allZero) {
        const firstWeights = resultsPerLevel[altLevelIds[0]]?.weights || [];
        alternatives?.forEach((alt, idx) => {
          altScores[alt.id] = firstWeights[idx] || 0;
        });
      }
    } else {
      const altLevelId = altLevelIds[0];
      console.log('[Results] Looking for alternative level, found:', altLevelId);
      if (altLevelId && resultsPerLevel[altLevelId]) {
        const altWeights = resultsPerLevel[altLevelId].weights || [];
        alternatives?.forEach((alt, idx) => {
          altScores[alt.id] = altWeights[idx] || 0;
        });
      } else {
        console.log('[Results] No alternative weights found');
      }
    }

    // Sort alternatives by score
    const alternativeScores = alternatives
      ?.map((a, idx) => ({
        id: a.id,
        name: a.name,
        score: altScores[a.id] || 0,
      }))
      .sort((a, b) => b.score - a.score)
      .map((a, idx) => ({ ...a, rank: idx + 1 })) || [];

    console.log('[Results] Using criteria level:', critLevelId);

    // Get consistency ratios for all completed experts
    const { data: allCRs } = await supabase
      .from('consistency_ratios')
      .select('expert_id, cr')
      .eq('case_id', caseId)
      .eq('level_id', critLevelId);

    const crByExpert = {};
    allCRs?.forEach(cr => {
      crByExpert[cr.expert_id] = cr.cr;
    });

    // Build experts array with name, email, and CR
    const expertsArray = completedExperts?.map(expert => ({
      id: expert.expert_id,
      name: expert.users?.name || 'Pakar Tanpa Nama',
      email: expert.users?.email || '',
      weight: expert.weight || 1,
      cr: crByExpert[expert.expert_id] || 0,
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
        criteriaWeights: (resultsPerLevel[critLevelId]?.weights || []).map((w, i) => ({
          id: topCriteria?.[i]?.id,
          name: topCriteria?.[i]?.name,
          weight: w || 0,
        })),
        alternativeScores,
        consistencyRatio: resultsPerLevel[critLevelId]?.cr || null,
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

  await caseService.assertCaseAccess(caseId, req.user.id);

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

    // Get criteria
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

    // Group judgments by expert and level (submitted only)
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

    // Resolve real level IDs (same convention as GET handler)
    const sLevelIds = new Set(Object.values(expertMatrices).flatMap(m => Object.keys(m)));
    const sCritLevelId = Array.from(sLevelIds).find(id => String(id).startsWith('crit'));
    const sAltLevelIds = Array.from(sLevelIds).filter(id => String(id).startsWith('alt-'));
    const isFuzzy = caseData?.method && caseData.method.includes('Fuzzy');

    const aggregateLevel = (levelId) => {
      const mats = [];
      const wts = [];
      completedExperts.forEach(expert => {
        if (expertMatrices[expert.expert_id][levelId]) {
          mats.push(expertMatrices[expert.expert_id][levelId]);
          wts.push(expert.weight || 1);
        }
      });
      if (mats.length === 0) return [];
      if (isFuzzy) {
        const tfn = mats.map(m => ahpService.fuzzifyMatrix(m));
        return ahpService.fuzzyPriorities(ahpService.aggregateFuzzyAIJ(tfn, wts));
      }
      return ahpService.calculateCR(ahpService.aggregateAIJ(mats, wts)).weights;
    };

    // Get aggregated criteria weights
    let aggregatedCritWeights = sCritLevelId ? aggregateLevel(sCritLevelId) : [];

    // Apply weight overrides
    const adjustedWeights = [...aggregatedCritWeights];
    if (criteriaWeightOverrides) {
      Object.entries(criteriaWeightOverrides).forEach(([critId, newWeight]) => {
        const critIdx = criteria?.findIndex(c => c.id === critId);
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

    // Weighted synthesis: score[alt] = sum_c adjustedW[c] * altWeight_c[alt]
    const topCrit = criteria || [];
    const altWeightsByCrit = sAltLevelIds.map(altId => ({
      critIdx: topCrit.findIndex(c => String(altId).slice(4) === String(c.id)),
      weights: aggregateLevel(altId),
    }));

    const synthScores = (critW) => (alternatives || []).map((alt, altIdx) => {
      let score = 0;
      altWeightsByCrit.forEach(({ critIdx, weights }) => {
        const cw = critIdx >= 0 ? (critW[critIdx] || 0) : 0;
        score += cw * (weights[altIdx] || 0);
      });
      // Legacy fallback: single unmapped alt level used directly
      if (altWeightsByCrit.length === 1 && altWeightsByCrit[0].critIdx < 0) {
        score = altWeightsByCrit[0].weights[altIdx] || 0;
      }
      return { id: alt.id, name: alt.name, score };
    });

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
  await caseService.assertCaseAccess(caseId, req.user.id);

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
