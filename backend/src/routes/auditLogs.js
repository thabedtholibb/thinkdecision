const express = require('express');
const authenticate = require('../middleware/authenticate');
const asyncHandler = require('../middleware/asyncHandler');
const { AppError } = require('../middleware/errorHandler');
const supabase = require('../config/supabase');
const { auditLogger } = require('../services/loggerService');

const router = express.Router();

/**
 * @swagger
 * /audit-logs:
 *   get:
 *     summary: Retrieve audit trail logs with filtering
 *     tags: [Audit Logs]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - name: userId
 *         in: query
 *         schema: { type: string, format: uuid }
 *         description: Filter by user ID
 *       - name: action
 *         in: query
 *         schema: { type: string, enum: [create, update, delete, read, submit, export] }
 *         description: Filter by action type
 *       - name: resourceType
 *         in: query
 *         schema: { type: string, enum: [case, criteria, alternative, judgment, result, user] }
 *         description: Filter by resource type
 *       - name: startDate
 *         in: query
 *         schema: { type: string, format: date-time }
 *         description: Filter from start date (ISO 8601)
 *       - name: endDate
 *         in: query
 *         schema: { type: string, format: date-time }
 *         description: Filter until end date (ISO 8601)
 *       - name: limit
 *         in: query
 *         schema: { type: integer, default: 50, maximum: 500 }
 *         description: Limit results
 *       - name: offset
 *         in: query
 *         schema: { type: integer, default: 0 }
 *         description: Offset for pagination
 *     responses:
 *       200:
 *         description: Audit logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string, format: uuid }
 *                       user_id: { type: string, format: uuid }
 *                       action: { type: string }
 *                       resource_type: { type: string }
 *                       resource_id: { type: string, format: uuid }
 *                       description: { type: string }
 *                       ip_address: { type: string }
 *                       user_agent: { type: string }
 *                       created_at: { type: string, format: date-time }
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total: { type: integer }
 *                     limit: { type: integer }
 *                     offset: { type: integer }
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const userId = req.query.userId;
  const action = req.query.action;
  const resourceType = req.query.resourceType;
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;
  const limit = Math.min(parseInt(req.query.limit) || 50, 500);
  const offset = parseInt(req.query.offset) || 0;

  // Permission check: users can only see their own audit logs, unless admin
  if (userId && userId !== req.user.id && req.user.role !== 'admin') {
    throw new AppError('Cannot view other user audit logs', 403, 'FORBIDDEN');
  }

  let query = supabase
    .from('audit_logs')
    .select('*', { count: 'exact' });

  // Apply filters
  if (userId) {
    query = query.eq('user_id', userId);
  } else if (req.user.role !== 'admin') {
    // Non-admins only see their own audit logs
    query = query.eq('user_id', req.user.id);
  }

  if (action) {
    query = query.eq('action', action);
  }

  if (resourceType) {
    query = query.eq('resource_type', resourceType);
  }

  if (startDate) {
    query = query.gte('created_at', startDate);
  }

  if (endDate) {
    query = query.lte('created_at', endDate);
  }

  // Order by created_at descending and apply pagination
  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    auditLogger.error('Failed to retrieve audit logs', { error });
    throw new AppError('Failed to retrieve audit logs', 500, 'AUDIT_QUERY_ERROR');
  }

  auditLogger.info('Audit logs retrieved', {
    userId: req.user.id,
    filters: { userId, action, resourceType, startDate, endDate },
    resultCount: data.length,
    totalCount: count,
  });

  res.json({
    success: true,
    data,
    pagination: {
      total: count,
      limit,
      offset,
    },
  });
}));

/**
 * @swagger
 * /audit-logs/summary:
 *   get:
 *     summary: Get audit trail statistics
 *     tags: [Audit Logs]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - name: period
 *         in: query
 *         schema: { type: string, enum: [day, week, month], default: week }
 *         description: Time period for statistics
 *     responses:
 *       200:
 *         description: Audit statistics retrieved successfully
 */
router.get('/summary', authenticate, asyncHandler(async (req, res) => {
  const period = req.query.period || 'week';
  const periodMs = {
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
  }[period];

  const startDate = new Date(Date.now() - periodMs).toISOString();

  let query = supabase
    .from('audit_logs')
    .select('action, resource_type, count()')
    .gte('created_at', startDate);

  if (req.user.role !== 'admin') {
    query = query.eq('user_id', req.user.id);
  }

  const { data, error } = await query.group_by(['action', 'resource_type']);

  if (error) {
    auditLogger.error('Failed to retrieve audit statistics', { error });
    throw new AppError('Failed to retrieve audit statistics', 500, 'AUDIT_STAT_ERROR');
  }

  res.json({
    success: true,
    period,
    data: data || [],
  });
}));

module.exports = router;
