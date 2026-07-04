const cacheService = require('./cacheService');
const ahpService = require('./ahpService');
const supabase = require('../config/supabase');

// Improvement 19: Optimize Aggregation Algorithm
// Pre-calculates and caches aggregation results to avoid expensive recalculations

const getCacheKey = {
  levelAggregation: (caseId, levelId) => `agg:${caseId}:level:${levelId}`,
  caseAggregation: (caseId) => `agg:${caseId}:full`,
  levelExperts: (caseId, levelId) => `agg:${caseId}:experts:${levelId}`,
};

// Pre-calculate and cache aggregation when expert submits
const preCalculateAggregation = async (caseId, levelId) => {
  try {
    const { data: completedExperts } = await supabase
      .from('case_experts')
      .select('expert_id, weight')
      .eq('case_id', caseId)
      .eq('status', 'completed');

    if (!completedExperts || completedExperts.length === 0) {
      return null;
    }

    // Get all judgments for this level
    const { data: judgments } = await supabase
      .from('judgments')
      .select('expert_id, matrix')
      .eq('case_id', caseId)
      .eq('level_id', levelId)
      .in('expert_id', completedExperts.map(e => e.expert_id));

    if (!judgments || judgments.length === 0) {
      return null;
    }

    // Extract matrices in order
    const matricesByExpert = judgments.map(j => j.matrix);

    // Perform aggregation
    const aggregatedMatrix = ahpService.aggregateAIJ(matricesByExpert);
    const { weights, CR } = ahpService.calculateCR(aggregatedMatrix);

    // Cache the aggregated result
    const cacheData = {
      matrix: aggregatedMatrix,
      weights,
      cr: CR,
      expertCount: matricesByExpert.length,
      timestamp: new Date().toISOString(),
    };

    const cacheKey = getCacheKey.levelAggregation(caseId, levelId);
    await cacheService.set(cacheKey, cacheData, 3600); // Cache for 1 hour

    // Cache expert participation info
    const expertsKey = getCacheKey.levelExperts(caseId, levelId);
    await cacheService.set(expertsKey, {
      experts: judgments.map(j => j.expert_id),
      count: judgments.length,
    }, 3600);

    return cacheData;
  } catch (error) {
    console.error('[Aggregation Cache] Error pre-calculating aggregation:', error);
    return null;
  }
};

// Get cached aggregation or calculate if not cached
const getAggregation = async (caseId, levelId) => {
  // Try cache first
  const cacheKey = getCacheKey.levelAggregation(caseId, levelId);
  const cached = await cacheService.get(cacheKey);

  if (cached) {
    console.log(`[Aggregation Cache] HIT for case ${caseId} level ${levelId}`);
    return cached;
  }

  console.log(`[Aggregation Cache] MISS for case ${caseId} level ${levelId}, pre-calculating...`);

  // Calculate and cache
  return preCalculateAggregation(caseId, levelId);
};

// Invalidate aggregation cache when judgment is updated
const invalidateAggregationCache = async (caseId, levelId = null) => {
  try {
    if (levelId) {
      // Invalidate specific level
      const cacheKey = getCacheKey.levelAggregation(caseId, levelId);
      const expertsKey = getCacheKey.levelExperts(caseId, levelId);
      await cacheService.del(cacheKey);
      await cacheService.del(expertsKey);
    } else {
      // Invalidate all aggregations for this case
      await cacheService.invalidatePattern(`agg:${caseId}:*`);
    }
  } catch (error) {
    console.error('[Aggregation Cache] Error invalidating cache:', error);
  }
};

// Calculate incremental aggregation (only recalculate changed levels)
const getIncrementalAggregation = async (caseId) => {
  try {
    // Get all levels that have completed judgments
    const { data: levels } = await supabase
      .from('judgments')
      .select('DISTINCT level_id')
      .eq('case_id', caseId);

    if (!levels || levels.length === 0) {
      return {};
    }

    const results = {};

    // Calculate aggregation for each level (cached)
    for (const { level_id } of levels) {
      const aggregation = await getAggregation(caseId, level_id);
      if (aggregation) {
        results[level_id] = aggregation;
      }
    }

    return results;
  } catch (error) {
    console.error('[Aggregation Cache] Error in incremental aggregation:', error);
    return {};
  }
};

// Get aggregation statistics
const getAggregationStats = async (caseId) => {
  try {
    const { data: levels } = await supabase
      .from('judgments')
      .select('DISTINCT level_id')
      .eq('case_id', caseId);

    if (!levels || levels.length === 0) {
      return {
        totalLevels: 0,
        cachedLevels: 0,
        cacheHitRate: 0,
      };
    }

    let cachedCount = 0;

    for (const { level_id } of levels) {
      const cacheKey = getCacheKey.levelAggregation(caseId, level_id);
      const cached = await cacheService.get(cacheKey);
      if (cached) cachedCount++;
    }

    return {
      totalLevels: levels.length,
      cachedLevels: cachedCount,
      cacheHitRate: (cachedCount / levels.length * 100).toFixed(2),
    };
  } catch (error) {
    console.error('[Aggregation Cache] Error getting stats:', error);
    return null;
  }
};

module.exports = {
  getAggregation,
  preCalculateAggregation,
  invalidateAggregationCache,
  getIncrementalAggregation,
  getAggregationStats,
  getCacheKey,
};
