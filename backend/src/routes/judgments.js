const express = require('express');
const Joi = require('joi');
const authenticate = require('../middleware/authenticate');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const judgmentService = require('../services/judgmentService');
const validationService = require('../services/validationService');
const caseService = require('../services/caseService');
const supabase = require('../config/supabase');
const { ForbiddenError } = require('../errors/AppErrors');

const router = express.Router({ mergeParams: true });

// Structural gate (shape/types) — Saaty-scale and matrix-bound checks still
// run via validationService below, this just rejects garbage bodies early.
// A comparison value is either a crisp Saaty number (AHP/ANP) or a TFN
// triple [l, m, u] (Fuzzy AHP/ANP) — rejecting arrays here used to make
// every fuzzy draft save fail with a validation error.
const comparisonValueSchema = Joi.alternatives().try(
  Joi.number().positive(),
  Joi.array().items(Joi.number().positive()).length(3)
);

const comparisonsSchema = Joi.object()
  .pattern(Joi.string().pattern(/^\d+-\d+$/), comparisonValueSchema)
  .min(1);

const legacyJudgmentSchema = Joi.object({
  caseId: Joi.string().required(),
  judgments: comparisonsSchema.required(),
  notes: Joi.string().allow('').max(2000).optional(),
}).unknown(true);

const draftJudgmentSchema = Joi.object({
  caseId: Joi.string().required(),
  comparisons: comparisonsSchema.required(),
}).unknown(true);

const submitJudgmentSchema = Joi.object({
  caseId: Joi.string().required(),
}).unknown(true);

// POST /judgments/:levelId - Save judgment draft (legacy route)
// expertId is always the authenticated caller — never trust a client-supplied
// expertId, or any authenticated user could forge another expert's judgments.
router.post('/:levelId', authenticate, validate(legacyJudgmentSchema), asyncHandler(async (req, res) => {
  const { caseId, judgments, notes } = req.validatedBody;
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
router.put('/:levelId', authenticate, validate(draftJudgmentSchema), asyncHandler(async (req, res) => {
  const { levelId } = req.params;
  const { caseId, comparisons } = req.validatedBody;
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

// GET /judgments/:caseId/mine - The authenticated expert's saved judgments
// for a case, as sparse comparisons per level. Lets the fill screen restore
// previously saved work instead of showing an empty (reset-looking) matrix.
router.get('/:caseId/mine', authenticate, asyncHandler(async (req, res) => {
  const judgments = await judgmentService.getMyJudgments(req.params.caseId, req.user.id);
  res.json({
    success: true,
    data: judgments,
  });
}));

// POST /judgments/:expertId/submit - Submit all judgments
router.post('/:expertId/submit', authenticate, validate(submitJudgmentSchema), asyncHandler(async (req, res) => {
  const { caseId } = req.validatedBody;
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
    .select('id, name, level, parent_criteria_id')
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

  // Expected pairwise levels, mirroring the frontend fill screen's naming:
  // 'crit' (criteria vs goal), 'sub-<critId>' per criterion that has
  // sub-criteria, and 'alt-<critId>' (alternatives per criterion). The old
  // code compared judgment level_ids ('crit', 'alt-x') against the numeric
  // criteria.level column (1/2), which never matched, so progress was
  // permanently 0%.
  const topCriteria = (criteria || []).filter(c => c.level === 1 || !c.parent_criteria_id);
  const subCriteria = (criteria || []).filter(c => c.level === 2 && c.parent_criteria_id);

  const expectedLevels = [{ id: 'crit', name: 'Kriteria vs Goal' }];
  topCriteria.forEach(c => {
    if (subCriteria.some(s => s.parent_criteria_id === c.id)) {
      expectedLevels.push({ id: `sub-${c.id}`, name: `Sub-Kriteria · ${c.name}` });
    }
  });
  topCriteria.forEach(c => {
    expectedLevels.push({ id: `alt-${c.id}`, name: `Alternatif · ${c.name}` });
  });

  const savedLevelIds = new Set((judgments || []).map(j => j.level_id));
  const submittedLevelIds = new Set((judgments || []).filter(j => j.submitted).map(j => j.level_id));

  const progressByLevel = expectedLevels.map(lv => ({
    levelId: lv.id,
    name: lv.name,
    saved: savedLevelIds.has(lv.id),
    submitted: submittedLevelIds.has(lv.id),
  }));

  const completedLevels = progressByLevel.filter(p => p.saved).length;

  res.json({
    success: true,
    data: {
      expertId,
      caseId,
      overallStatus: caseExpert?.status || 'invited',
      totalLevels: expectedLevels.length,
      completedLevels,
      progressByLevel,
      progressPercentage: expectedLevels.length > 0
        ? Math.round((completedLevels / expectedLevels.length) * 100)
        : 0
    }
  });
}));

module.exports = router;
