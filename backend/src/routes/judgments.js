const express = require('express');
const authenticate = require('../middleware/authenticate');
const asyncHandler = require('../middleware/asyncHandler');
const judgmentService = require('../services/judgmentService');
const validationService = require('../services/validationService');
const caseService = require('../services/caseService');
const supabase = require('../config/supabase');
const { ForbiddenError } = require('../errors/AppErrors');

const router = express.Router({ mergeParams: true });

// POST /judgments/:levelId - Save judgment draft (legacy route)
// expertId is always the authenticated caller — never trust a client-supplied
// expertId, or any authenticated user could forge another expert's judgments.
router.post('/:levelId', authenticate, asyncHandler(async (req, res) => {
  const { caseId, judgments, notes } = req.body;
  const expertId = req.user.id;

  // Validate input
  const validationErrors = validationService.validateExpertJudgment(
    caseId,
    expertId,
    req.params.levelId,
    judgments
  );

  if (validationErrors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Judgment validation failed',
        details: validationErrors
      }
    });
  }

  const result = await judgmentService.saveJudgment(
    caseId,
    expertId,
    req.params.levelId,
    judgments,
    notes
  );

  res.json({
    success: true,
    message: 'Judgment saved successfully',
    data: result,
  });
}));

// PUT /judgments/:levelId - Save judgment draft (new route)
router.put('/:levelId', authenticate, asyncHandler(async (req, res) => {
  const { levelId } = req.params;
  const { caseId, comparisons } = req.body;
  const expertId = req.user.id;

  // Validate input
  const validationErrors = validationService.validateExpertJudgment(
    caseId,
    expertId,
    levelId,
    comparisons
  );

  if (validationErrors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Judgment validation failed',
        details: validationErrors
      }
    });
  }

  const result = await judgmentService.saveJudgment(
    caseId,
    expertId,
    levelId,
    comparisons
  );

  res.json({
    success: true,
    message: 'Judgment draft saved successfully',
    data: result,
  });
}));

// POST /judgments/:expertId/submit - Submit all judgments
router.post('/:expertId/submit', authenticate, asyncHandler(async (req, res) => {
  const { caseId } = req.body;
  const { expertId } = req.params;

  if (expertId !== req.user.id) {
    throw new ForbiddenError('You can only submit your own judgments');
  }

  console.log('[Judgments] Submit request received:', { expertId, caseId, userId: req.user.id });

  const result = await judgmentService.submitJudgments(caseId, expertId);

  console.log('[Judgments] Submit successful:', { expertId, caseId, result });

  res.json({
    success: true,
    message: 'Judgments submitted successfully',
    data: result,
  });
}));

// GET /judgments/:expertId/:caseId/progress - Get progress of expert's judgments
router.get('/:expertId/:caseId/progress', authenticate, asyncHandler(async (req, res) => {
  const { expertId, caseId } = req.params;

  // Only the expert themselves, or the case's creator, may view this progress
  if (expertId !== req.user.id) {
    const { role } = await caseService.assertCaseAccess(caseId, req.user.id);
    if (role !== 'creator') {
      throw new ForbiddenError('You do not have access to this expert\'s progress');
    }
  }

  // Get criteria for the case
  const { data: criteria } = await supabase
    .from('criteria')
    .select('id, name, level')
    .eq('case_id', caseId)
    .order('level')
    .order('id');

  // Get expert's judgments
  const { data: judgments } = await supabase
    .from('judgments')
    .select('level_id, submitted')
    .eq('case_id', caseId)
    .eq('expert_id', expertId);

  // Get case_expert status
  const { data: caseExpert } = await supabase
    .from('case_experts')
    .select('status')
    .eq('case_id', caseId)
    .eq('expert_id', expertId)
    .single();

  // Calculate progress by level
  const progressByLevel = {};
  if (criteria) {
    criteria.forEach(c => {
      if (!progressByLevel[c.level]) {
        progressByLevel[c.level] = { level: c.level, total: 0, completed: 0, criteria: [] };
      }
      progressByLevel[c.level].total++;
      progressByLevel[c.level].criteria.push({
        id: c.id,
        name: c.name,
        completed: judgments?.some(j => j.level_id === c.level && j.submitted) || false
      });
    });
  }

  const completedLevels = Object.values(progressByLevel)
    .filter(p => p.completed === p.total).length;

  res.json({
    success: true,
    data: {
      expertId,
      caseId,
      overallStatus: caseExpert?.status || 'invited',
      totalLevels: Object.keys(progressByLevel).length,
      completedLevels,
      progressByLevel: Object.values(progressByLevel),
      progressPercentage: Object.keys(progressByLevel).length > 0
        ? Math.round((completedLevels / Object.keys(progressByLevel).length) * 100)
        : 0
    }
  });
}));

module.exports = router;
