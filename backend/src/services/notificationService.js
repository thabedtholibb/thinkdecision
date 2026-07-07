const supabase = require('../config/supabase');

async function createNotification(recipientId, type, data) {
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

module.exports = { createNotification };
