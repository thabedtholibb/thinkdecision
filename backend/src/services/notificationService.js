const supabase = require('../config/supabase');

// A6: canonical notification types — single source of truth shared by the
// CHECK constraint (migration 2025100106) and the frontend icon map.
// 'expert_completed' is what the backend actually sends today; the other
// legacy variants are kept valid so old rows keep validating.
const NOTIFICATION_TYPES = [
  'expert_invited',
  'expert_completed',
  'expert_submission',
  'case_published',
  'case_completed',
  'aggregation_ready',
  'judgment_reminder',
  'invitation',
  'clarity_request',
];

async function createNotification(recipientId, type, data) {
  if (!NOTIFICATION_TYPES.includes(type)) {
    throw new Error(
      `Unknown notification type '${type}'. Valid: ${NOTIFICATION_TYPES.join(', ')}`
    );
  }
  try {
    // The `notifications` table only has recipient_id/type/message/read/
    // related_data columns — title, case_id, expert_id, action_url, and data
    // don't exist as their own columns (a real insert was failing with
    // "Could not find the 'action_url' column"). Fold everything else into
    // the related_data jsonb column instead of dropping it.
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert([{
        recipient_id: recipientId,
        type,
        message: data.message,
        related_data: {
          title: data.title,
          caseId: data.caseId,
          expertId: data.expertId,
          actionUrl: data.actionUrl,
          ...(data.metadata || {}),
        },
      }])
      .select()
      .single();

    if (error) throw error;
    return notification;
  } catch (err) {
    console.error('Error creating notification:', err);
    throw err;
  }
}

module.exports = { createNotification, NOTIFICATION_TYPES };
