const supabase = require('../config/supabase');
const ahpService = require('./ahpService');
const notificationService = require('./notificationService');
const { auditLog } = require('./auditService');
const validationService = require('./validationService');
const cacheService = require('./cacheService');
const aggregationCacheService = require('./aggregationCacheService');
const { ForbiddenError, MatrixValidationError } = require('../errors/AppErrors');

// An expert may only save/submit judgments for cases they were actually
// invited to — without this, any authenticated user could inject or
// overwrite judgment data on a case they have no relationship with.
const assertExpertCaseMembership = async (caseId, expertId) => {
  const { data, error } = await supabase
    .from('case_experts')
    .select('case_id')
    .eq('case_id', caseId)
    .eq('expert_id', expertId)
    .single();

  if (error || !data) {
    throw new ForbiddenError('You are not invited as an expert on this case');
  }
};

const saveJudgment = async (caseId, expertId, levelId, judgments, notes = '') => {
  await assertExpertCaseMembership(caseId, expertId);

  // Build full matrix from sparse input
  const matrix = buildMatrix(judgments);

  // Validate matrix structure
  const matrixErrors = validationService.validateMatrix(matrix, levelId);
  if (matrixErrors.length > 0) {
    // Throw the real AppError subclass so errorHandler's `instanceof AppError`
    // check recognizes it and returns 400 with details, instead of masking
    // a legitimate validation failure as a generic 500.
    throw new MatrixValidationError(matrixErrors);
  }

  // Calculate CR
  const { CR, weights } = ahpService.calculateCR(matrix);

  // Check CR threshold
  const { isAcceptable, warnings } = validationService.checkConsistencyRatio(CR);

  // Save judgment
  const { data: judgment, error: judgmentError } = await supabase
    .from('judgments')
    .upsert({
      case_id: caseId,
      expert_id: expertId,
      level_id: levelId,
      level_label: `Level: ${levelId}`,
      matrix: matrix,
      notes,
      saved_at: new Date().toISOString(),
    }, {
      onConflict: 'case_id,expert_id,level_id',
    })
    .select()
    .single();

  if (judgmentError) throw judgmentError;

  // Save consistency ratio
  const { error: crError } = await supabase
    .from('consistency_ratios')
    .upsert({
      case_id: caseId,
      expert_id: expertId,
      level_id: levelId,
      level_label: `Level: ${levelId}`,
      cr: CR,
      weights: weights,
      calculated_at: new Date().toISOString(),
    }, {
      onConflict: 'case_id,expert_id,level_id',
    });

  if (crError) throw crError;

  return { levelId, cr: CR, weights, crWarnings: warnings };
};

const submitJudgments = async (caseId, expertId) => {
  console.log('[JudgmentService] submitJudgments called:', { caseId, expertId });

  await assertExpertCaseMembership(caseId, expertId);

  // Mark all judgments as submitted
  const { error } = await supabase
    .from('judgments')
    .update({ submitted: true })
    .eq('case_id', caseId)
    .eq('expert_id', expertId);

  if (error) throw error;
  console.log('[JudgmentService] Judgments marked as submitted');

  // Update case_expert status
  const { data, error: updateError } = await supabase
    .from('case_experts')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('case_id', caseId)
    .eq('expert_id', expertId)
    .select()
    .single();

  if (updateError) {
    console.error('[JudgmentService] Update case_expert failed:', updateError);
    throw updateError;
  }
  console.log('[JudgmentService] case_expert status updated to completed:', data);

  // Fetch case details to get creator and name
  const { data: caseData } = await supabase
    .from('cases')
    .select('id, name, creator_id')
    .eq('id', caseId)
    .single();

  // Fetch expert details
  const { data: expertData } = await supabase
    .from('users')
    .select('id, name')
    .eq('id', expertId)
    .single();

  // Count completed experts
  const { data: caseExperts } = await supabase
    .from('case_experts')
    .select('expert_id, status')
    .eq('case_id', caseId);

  console.log('[JudgmentService] caseExperts:', caseExperts);

  if (caseData && caseData.creator_id && expertData) {
    const completedCount = caseExperts.filter(e => e.status === 'completed').length;
    const totalCount = caseExperts.length;

    console.log('[JudgmentService] Creating notification:', { completedCount, totalCount, creatorId: caseData.creator_id });

    try {
      // 'expert_submission' isn't a valid value — the notifications table has
      // a CHECK constraint on `type` (see notifications_type_check) allowing
      // only expert_invited/accepted/declined/started/completed/
      // clarity_request, case_published/completed, aggregation_ready.
      await notificationService.createNotification(
        caseData.creator_id,
        'expert_completed',
        {
          title: `${expertData.name} has completed their judgments`,
          message: `${completedCount} of ${totalCount} experts completed for "${caseData.name}"`,
          caseId,
          expertId,
          actionUrl: `/creator/results/${caseId}`,
          metadata: { completedCount, totalCount }
        }
      );
      console.log('[JudgmentService] Notification created successfully');
    } catch (notifError) {
      console.error('[JudgmentService] Failed to create notification:', notifError);
      // Don't fail submission if notification creation fails
    }
  }

  // Audit log
  if (expertData && caseData) {
    auditLog(
      expertId,
      'SUBMIT_JUDGMENTS',
      'judgments',
      caseId,
      `Submitted judgments for case: ${caseData.name}`
    );
  }

  // Invalidate results cache when new judgments are submitted
  const cacheKey = cacheService.getCacheKeys.caseResults(caseId);
  await cacheService.del(cacheKey);
  console.log('[JudgmentService] Invalidated cache for case:', caseId);

  // Improvement 19: Pre-calculate aggregation for all levels (incremental caching)
  try {
    // postgrest-js select strings don't support SQL `DISTINCT` — de-dupe client-side.
    const { data: levelRows } = await supabase
      .from('judgments')
      .select('level_id')
      .eq('case_id', caseId);

    const levelIds = [...new Set((levelRows || []).map(r => r.level_id))];

    for (const level_id of levelIds) {
      // Pre-calculate and cache aggregation for each level
      await aggregationCacheService.preCalculateAggregation(caseId, level_id);
      console.log('[JudgmentService] Pre-calculated aggregation for level:', level_id);
    }
  } catch (aggError) {
    console.error('[JudgmentService] Error pre-calculating aggregation:', aggError);
    // Don't fail submission if aggregation cache fails
  }

  // Check if all experts completed and calculate aggregated results
  if (caseData) {
    const { data: allExperts } = await supabase
      .from('case_experts')
      .select('expert_id, status')
      .eq('case_id', caseId);

    const allCompleted = allExperts && allExperts.every(e => e.status === 'completed');
    if (allCompleted) {
      await calculateAndStoreAggregatedResults(caseId);
    }
  }

  console.log('[JudgmentService] submitJudgments complete, returning:', data);
  return data;
};

const calculateAndStoreAggregatedResults = async (caseId) => {
  try {
    console.log('[JudgmentService] Calculating aggregated results for case:', caseId);

    // Fetch all judgments for this case
    const { data: judgments } = await supabase
      .from('judgments')
      .select('*')
      .eq('case_id', caseId)
      .eq('submitted', true);

    if (!judgments || judgments.length === 0) {
      console.log('[JudgmentService] No submitted judgments found');
      return;
    }

    // Group by level and aggregate using geometric mean
    const levelGroups = {};
    judgments.forEach(j => {
      if (!levelGroups[j.level_id]) {
        levelGroups[j.level_id] = [];
      }
      levelGroups[j.level_id].push(j.matrix);
    });

    // Calculate geometric mean for each level
    const aggregatedWeights = {};
    for (const [levelId, matrices] of Object.entries(levelGroups)) {
      const n = matrices[0]?.length || 0;
      const geomMeanMatrix = Array(n).fill(0).map(() => Array(n).fill(0));

      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          let product = 1;
          for (const matrix of matrices) {
            product *= matrix[i][j];
          }
          geomMeanMatrix[i][j] = Math.pow(product, 1 / matrices.length);
        }
      }

      // Calculate weights using ahpService
      const { weights } = ahpService.calculateCR(geomMeanMatrix);
      aggregatedWeights[levelId] = weights;
    }

    // Store in aggregated_results
    const { data: caseExperts } = await supabase
      .from('case_experts')
      .select('expert_id')
      .eq('case_id', caseId);

    // aggregated_results.alternative_scores is NOT NULL in the real schema —
    // pull the alternative-level weights (level id starting with "alt-", same
    // convention results.js's GET handler uses) or fall back to {} rather
    // than violate the constraint and silently drop the whole upsert.
    const altLevelId = Object.keys(aggregatedWeights).find(id => id.startsWith('alt-'));
    const alternativeScores = altLevelId ? aggregatedWeights[altLevelId] : {};

    const { error } = await supabase
      .from('aggregated_results')
      .upsert({
        case_id: caseId,
        aggregation_method: 'AIJ',
        expert_count: caseExperts?.length || 0,
        completed_expert_count: caseExperts?.length || 0,
        criteria_weights: aggregatedWeights,
        alternative_scores: alternativeScores,
        calculated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('[JudgmentService] Failed to store aggregated results:', error);
    } else {
      console.log('[JudgmentService] Aggregated results calculated and stored successfully');
    }
  } catch (err) {
    console.error('[JudgmentService] Error calculating aggregated results:', err);
  }
};

const buildMatrix = (sparse) => {
  // Count items from sparse keys (e.g., "0-1", "0-2")
  const indices = new Set();
  for (const key in sparse) {
    const [i, j] = key.split('-').map(Number);
    indices.add(i);
    indices.add(j);
  }

  const n = Math.max(...indices) + 1 || 2;
  if (n > validationService.MAX_MATRIX_SIZE) {
    const error = new Error(`Matrix size ${n} exceeds maximum of ${validationService.MAX_MATRIX_SIZE}`);
    error.code = 'MATRIX_TOO_LARGE';
    throw error;
  }
  const matrix = Array(n).fill(0).map(() => Array(n).fill(1));

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const key = `${i}-${j}`;
      const value = sparse[key];
      if (value && value > 0) {
        matrix[i][j] = value;
        matrix[j][i] = 1 / value;
      }
    }
  }

  return matrix;
};

module.exports = {
  saveJudgment,
  submitJudgments,
  assertExpertCaseMembership,
};
