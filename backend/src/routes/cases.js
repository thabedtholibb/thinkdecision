const express = require('express');
const Joi = require('joi');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const asyncHandler = require('../middleware/asyncHandler');
const { parsePaginationParams, buildPaginationResponse } = require('../middleware/pagination');
const caseService = require('../services/caseService');
const supabase = require('../config/supabase');

const router = express.Router();

const createCaseSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow(''),
  objective: Joi.string().allow(''),
  method: Joi.string().valid('AHP', 'ANP', 'Fuzzy AHP', 'Fuzzy ANP').required(),
  deadline: Joi.string().required(), // Accept as string since frontend sends string
  goal: Joi.object({ name: Joi.string().required() }).optional(),
  criteria: Joi.array().items(
    Joi.object({
      id: Joi.string().required(),
      name: Joi.string().required(),
      desc: Joi.string().allow('').optional(),
      description: Joi.string().allow('').optional(),
      subs: Joi.array().optional(),
    })
  ).optional(),
  alternatives: Joi.array().items(
    Joi.object({
      id: Joi.string().required(),
      name: Joi.string().required(),
    })
  ).optional(),
  experts: Joi.array().items(
    Joi.object({
      email: Joi.string().email().required(),
      weight: Joi.number().positive().max(10).optional(),
      name: Joi.string().max(200).optional(),
      role: Joi.string().max(100).optional(),
      institution: Joi.string().max(200).optional(),
    })
  ).optional(),
  dependencies: Joi.array().items(
    Joi.object({
      from: Joi.string().required(),
      to: Joi.string().required(),
    })
  ).optional(),
}).unknown(true);

const requestMeta = (req) => ({ ip: req.ip, ua: req.get('User-Agent') });

router.post('/', authenticate, validate(createCaseSchema), asyncHandler(async (req, res) => {
  const caseRecord = await caseService.createCase(req.user.id, req.validatedBody);
  res.status(201).json({
    success: true,
    data: caseRecord,
  });
}));

router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { limit, offset } = parsePaginationParams(req.query);
  const filters = {
    status: req.query.status,
    method: req.query.method,
    search: req.query.search,
  };

  // Get total count (must match getCases filters, incl. soft-delete)
  let query = supabase.from('cases').select('id', { count: 'exact', head: true });
  query = query.eq('creator_id', req.user.id).is('deleted_at', null);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.method) query = query.eq('method', filters.method);

  const { count: total } = await query;

  // Get paginated results
  const cases = await caseService.getCases(req.user.id, filters, limit, offset);

  res.json({
    success: true,
    ...buildPaginationResponse(cases, total || 0, limit, offset),
  });
}));

router.get('/:caseId', authenticate, asyncHandler(async (req, res) => {
  const caseRecord = await caseService.getCaseById(req.params.caseId, req.user.id);
  res.json({
    success: true,
    data: caseRecord,
  });
}));

router.post('/publish', authenticate, validate(createCaseSchema), asyncHandler(async (req, res) => {
  // Create case and publish in one step (createCase returns { data, invited, failed })
  const created = await caseService.createCase(req.user.id, req.validatedBody);
  const publishedCase = await caseService.publishCase(created.data.id, req.user.id, requestMeta(req));

  res.status(201).json({
    success: true,
    message: 'Case published successfully',
    data: publishedCase,
    invited: created.invited,
    failed: created.failed,
  });
}));

router.post('/:caseId/publish', authenticate, asyncHandler(async (req, res) => {
  const caseRecord = await caseService.publishCase(req.params.caseId, req.user.id, requestMeta(req));
  res.json({
    success: true,
    message: 'Case published successfully',
    data: caseRecord,
  });
}));

router.delete('/:caseId', authenticate, asyncHandler(async (req, res) => {
  const result = await caseService.softDeleteCase(req.params.caseId, req.user.id, requestMeta(req));
  res.json({ success: true, ...result });
}));

router.post('/:caseId/restore', authenticate, asyncHandler(async (req, res) => {
  const result = await caseService.restoreCase(req.params.caseId, req.user.id, requestMeta(req));
  res.json({ success: true, ...result });
}));

module.exports = router;
