const express = require('express');
const authenticate = require('../middleware/authenticate');
const asyncHandler = require('../middleware/asyncHandler');
const { NotFoundError } = require('../errors/AppErrors');
const supabase = require('../config/supabase');

const router = express.Router();

router.get('/', authenticate, asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;

  const { data, error, count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('recipient_id', req.user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

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

router.patch('/:notificationId', authenticate, asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('id', req.params.notificationId)
    .eq('recipient_id', req.user.id)
    .select()
    .single();

  if (error || !data) {
    throw new NotFoundError('Notification');
  }

  res.json({
    success: true,
    data,
  });
}));

router.post('/mark-all-read', authenticate, asyncHandler(async (req, res) => {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('recipient_id', req.user.id)
    .eq('read', false);

  if (error) throw error;

  res.json({
    success: true,
    message: 'All notifications marked as read',
  });
}));

module.exports = router;
