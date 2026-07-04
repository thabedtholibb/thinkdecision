const express = require('express');
const authenticate = require('../middleware/authenticate');
const asyncHandler = require('../middleware/asyncHandler');
const supabase = require('../config/supabase');
const ahpService = require('../services/ahpService');
const cacheService = require('../services/cacheService');

const router = express.Router({ mergeParams: true });

router.get('/:caseId', authenticate, asyncHandler(async (req, res) => {
  const { caseId } = req.params;
  const method = req.query.method || 'AIJ';
  const cacheKey = cacheService.getCacheKeys.caseResults(caseId);

  // Try to get from cache
  const cached = await cacheService.get(cacheKey);
  if (cached) {
    console.log(`[Results] Cache HIT for ${caseId}`);
    return res.json(cached);
  }

  console.log(`[Results] Cache MISS for ${caseId}`);

  try {
    // Get case info
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('*')
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

    // Get judgments to check who actually submitted (not just status field)
    const { data: allJudgments } = await supabase
      .from('judgments')
      .select('expert_id')
      .eq('case_id', caseId);

    const expertsWithJudgments = new Set(allJudgments?.map(j => j.expert_id) || []);

    const totalExperts = allExperts?.length || 0;
    // Count experts who have submitted judgments (more reliable than status field)
    const completedCount = allExperts?.filter(e => expertsWithJudgments.has(e.expert_id)).length || 0;

    console.log('[Results] Case:', caseId, 'Total experts:', totalExperts, 'With judgments:', completedCount, 'Experts:', allExperts);

    // Get criteria and alternatives
    const { data: criteria } = await supabase
      .from('criteria')
      .select('*')
      .eq('case_id', caseId)
      .order('level', { ascending: true });

    const { data: alternatives } = await supabase
      .from('alternatives')
      .select('*')
      .eq('case_id', caseId);

    // Fetch dependencies if ANP method
    const isANP = caseData?.method && (caseData.method === 'ANP' || caseData.method === 'Fuzzy ANP');
    let dependencies = [];
    if (isANP) {
      const { data: depsData } = await supabase
        .from('dependencies')
        .select('*')
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

    // Get judgments for each expert
    const { data: judgments } = await supabase
      .from('judgments')
      .select('*')
      .eq('case_id', caseId);

    console.log('[Results] Judgments found:', judgments?.length || 0, 'Data:', judgments);

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

    console.log('[Results] Grouping judgments. Total judgments:', judgments.length);
    judgments.forEach(j => {
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
    judgments.forEach(j => levelIds.add(j.level_id));

    console.log('[Results] Level IDs from judgments:', Array.from(levelIds));

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
          // For fuzzy, matrices contain TFN values [l,m,u]
          const aggregatedFuzzyMatrix = ahpService.aggregateFuzzyAIJ(matricesForLevel);
          console.log('[Results] Aggregated fuzzy matrix for level', levelId, ':', aggregatedFuzzyMatrix);

          // Get fuzzy weights
          levelWeights = ahpService.fuzzyPriorities(aggregatedFuzzyMatrix);

          // For CR, defuzzify and calculate on crisp matrix
          const defuzzifiedMatrix = ahpService.defuzzifyMatrix(aggregatedFuzzyMatrix);
          const crResult = ahpService.calculateCR(defuzzifiedMatrix);
          levelCR = crResult.CR;
        } else {
          // For AHP/ANP, use standard AIJ
          aggregatedMatrix = ahpService.aggregateAIJ(matricesForLevel);
          console.log('[Results] Aggregated matrix for level', levelId, ':', aggregatedMatrix);

          const crResult = ahpService.calculateCR(aggregatedMatrix);
          levelCR = crResult.CR;

          // For ANP, apply network dependencies to weights
          if (isANP && levelId === critLevelId && dependencies.length > 0) {
            // Apply ANP with dependencies for criteria level
            levelWeights = ahpService.calculateANPWeights(aggregatedMatrix, dependencies);
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

    // Calculate alternative scores
    const altScores = {};
    alternatives?.forEach(alt => {
      altScores[alt.id] = 1;
    });

    // Find the alternative level (starts with 'alt-') to get alternative scores
    const altLevelId = Array.from(levelIds).find(id => String(id).startsWith('alt-'));
    console.log('[Results] Looking for alternative level, found:', altLevelId);

    if (altLevelId && resultsPerLevel[altLevelId]) {
      const altWeights = resultsPerLevel[altLevelId].weights || [];
      console.log('[Results] Alternative weights from level', altLevelId, ':', altWeights);
      alternatives?.forEach((alt, idx) => {
        altScores[alt.id] = altWeights[idx] || 0;
      });
    } else {
      console.log('[Results] No alternative weights found');
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

    // Find criteria level (starts with 'crit')
    const critLevelId = Array.from(levelIds).find(id => String(id).startsWith('crit'));
    console.log('[Results] Looking for criteria level, found:', critLevelId);

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
          id: criteria?.[i]?.id,
          name: criteria?.[i]?.name,
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
        message: error.message,
      },
    });
  }
}));

// Sensitivity analysis endpoint
router.post('/:caseId/sensitivity', authenticate, async (req, res) => {
  const { caseId } = req.params;
  const { criteriaWeightOverrides } = req.body;

  try {
    // Get case info
    const { data: caseData } = await supabase
      .from('cases')
      .select('*')
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
      .select('*')
      .eq('case_id', caseId)
      .eq('level', 1)
      .order('id');

    // Get alternatives
    const { data: alternatives } = await supabase
      .from('alternatives')
      .select('*')
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
      .select('*')
      .eq('case_id', caseId);

    if (!judgments || judgments.length === 0 || !completedExperts) {
      return res.json({
        success: true,
        status: 'waiting',
        data: { message: 'No completed judgments yet' }
      });
    }

    // Group judgments by expert and level
    const expertMatrices = {};
    completedExperts.forEach(expert => {
      expertMatrices[expert.expert_id] = {};
    });

    judgments.forEach(j => {
      if (j.expert_id in expertMatrices) {
        if (!expertMatrices[j.expert_id][j.level_id]) {
          expertMatrices[j.expert_id][j.level_id] = [];
        }
        expertMatrices[j.expert_id][j.level_id] = j.matrix;
      }
    });

    // Get aggregated criteria weights (level 1)
    let aggregatedCritWeights = [];
    const matricesForLevel1 = [];

    completedExperts.forEach(expert => {
      if (expertMatrices[expert.expert_id][1]) {
        matricesForLevel1.push(expertMatrices[expert.expert_id][1]);
      }
    });

    if (matricesForLevel1.length > 0) {
      aggregatedCritWeights = ahpService.aggregateAIJ(matricesForLevel1);
      aggregatedCritWeights = ahpService.calculateCR(aggregatedCritWeights).weights;
    }

    // Apply weight overrides
    const adjustedWeights = [...aggregatedCritWeights];
    if (criteriaWeightOverrides) {
      Object.entries(criteriaWeightOverrides).forEach(([critId, newWeight]) => {
        const critIdx = criteria?.findIndex(c => c.id === critId);
        if (critIdx >= 0) {
          adjustedWeights[critIdx] = newWeight;
        }
      });

      // Normalize weights to sum to 1
      const sum = adjustedWeights.reduce((a, b) => a + b, 0);
      adjustedWeights.forEach((_, i) => {
        adjustedWeights[i] /= sum;
      });
    }

    // Calculate alternative scores with adjusted weights
    const altScores = {};
    alternatives?.forEach(alt => {
      altScores[alt.id] = 1;
    });

    // Get alternative weights from level 2 (alternatives vs criteria)
    const matricesForLevel2 = [];
    completedExperts.forEach(expert => {
      if (expertMatrices[expert.expert_id][2]) {
        matricesForLevel2.push(expertMatrices[expert.expert_id][2]);
      }
    });

    let alternativeWeights = [];
    if (matricesForLevel2.length > 0) {
      const aggAltMatrix = ahpService.aggregateAIJ(matricesForLevel2);
      alternativeWeights = ahpService.calculateCR(aggAltMatrix).weights;
    }

    // Apply alternative weights with adjusted criteria weights
    const sensitivityScores = alternatives?.map((alt, altIdx) => {
      const score = adjustedWeights.reduce((sum, critWeight, critIdx) => {
        return sum + (critWeight * (alternativeWeights[altIdx] || 0));
      }, 0);
      return {
        id: alt.id,
        name: alt.name,
        score: score
      };
    }) || [];

    // Sort and rank
    const baselineScores = alternatives?.map((alt, altIdx) => ({
      id: alt.id,
      name: alt.name,
      score: aggregatedCritWeights[altIdx] || 0
    })) || [];

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
      error: { message: error.message }
    });
  }
});

// Expert Discrepancy Analysis endpoint
router.get('/:caseId/discrepancy', authenticate, async (req, res) => {
  const { caseId } = req.params;

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
      .select('*')
      .eq('case_id', caseId);

    // Get consistency ratios
    const { data: allCRs } = await supabase
      .from('consistency_ratios')
      .select('expert_id, level_id, cr')
      .eq('case_id', caseId);

    // Get criteria
    const { data: criteria } = await supabase
      .from('criteria')
      .select('*')
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

        const max = Math.max(...weightsForCriteria);
        const min = Math.min(...weightsForCriteria);
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
        message: error.message
      }
    });
  }
});

module.exports = router;
