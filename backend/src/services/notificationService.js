const supabase = require('../config/supabase');

async function createNotification(recipientId, type, data) {
  try {
    const { notification, error } = await supabase
      .from('notifications')
      .insert([{
        recipient_id: recipientId,
        type,
        title: data.title,
        message: data.message,
        case_id: data.caseId,
        expert_id: data.expertId,
        action_url: data.actionUrl,
        data: data.metadata || {}
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
