const supabase = require('../config/supabase');

const auditLog = async (userId, action, resourceType, resourceId, description, changes = null, ipAddress = null, userAgent = null) => {
  try {
    const { error } = await supabase
      .from('audit_logs')
      .insert([{
        user_id: userId,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        description,
        changes: changes ? JSON.stringify(changes) : null,
        ip_address: ipAddress,
        user_agent: userAgent,
      }]);

    if (error) {
      console.error('[AuditService] Failed to log action:', error);
    }
  } catch (err) {
    console.error('[AuditService] Error:', err);
  }
};

module.exports = { auditLog };
