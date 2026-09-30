const express = require('express');
const authenticate = require('../middleware/authenticate');
const asyncHandler = require('../middleware/asyncHandler');
const { NotFoundError } = require('../errors/AppErrors');
const { parseCursor, applyCursor, nextCursorFrom } = require('../middleware/pagination');
const supabase = require('../config/supabase');

const router = express.Router();

router.get('/', authenticate, asyncHandler(async (req, res) => {
  // Cap limit: uncapped parseInt let callers request millions of rows.
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
  const offset = Math.max(parseInt(req.query.offset) || 0, 0);
  const cursor = parseCursor(req.query);

  let qb = supabase
    .from('notifications')
    .select('id,recipient_id,type,message,read,read_at,related_data,created_at', { count: 'exact' })
    .eq('recipient_id', req.user.id)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false });

  if (cursor) {
    // Keyset mode: stable under inserts, no offset scan. Fetch one extra row
    // to know whether a next page exists; offset params are ignored.
    const { data, error } = await applyCursor(qb, cursor).limit(limit + 1);
    if (error) throw error;
    const page = (data || []).slice(0, limit);
    return res.json({
      success: true,
      data: page,
      pagination: { total: null, limit, offset: null, nextCursor: nextCursorFrom(data || [], limit) },
    });
  }

  const { data, error, count } = await qb.range(offset, offset + limit - 1);

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
