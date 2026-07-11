const supabase = require('../config/supabase');
const { AppError } = require('../middleware/errorHandler');
const { CaseNotFoundError } = require('../errors/AppErrors');
const { auditLog } = require('./auditService');
const { withTransaction } = require('../middleware/transaction');

const createCase = async (creatorId, caseData) => {
  // withTransaction wraps the operation's return value as { success, data,
  // duration } — unwrap .data here so callers (cases.js) get the actual case
  // record. Without this, `caseRecord.id` was always undefined and
  // POST /cases/publish always 404'd on the immediately-following publishCase call.
  const result = await withTransaction('createCase', async () => {
    // Create case
    const { data: caseRecord, error: caseError } = await supabase
      .from('cases')
      .insert({
        creator_id: creatorId,
        name: caseData.name,
        description: caseData.description,
        objective: caseData.objective,
        method: caseData.method,
        deadline: caseData.deadline,
        status: 'draft',
      })
      .select()
      .single();

    if (caseError) throw new AppError('Failed to create case: ' + caseError.message, 400, 'CASE_CREATE_ERROR');

  // Create goal
  if (caseData.goal) {
    await supabase.from('goals').insert({
      case_id: caseRecord.id,
      name: caseData.goal.name,
    });
  }

  // Create criteria
  if (caseData.criteria && caseData.criteria.length > 0) {
    const criteriasToInsert = caseData.criteria.map(c => ({
      id: c.id,
      case_id: caseRecord.id,
      name: c.name,
      description: c.description,
      level: 1,
    }));

    await supabase.from('criteria').insert(criteriasToInsert);

    // Create sub-criteria
    for (const criterion of caseData.criteria) {
      if (criterion.subs && criterion.subs.length > 0) {
        const subsToInsert = criterion.subs.map(s => ({
          id: s.id,
          case_id: caseRecord.id,
          parent_criteria_id: criterion.id,
          name: s.name,
          level: 2,
        }));
        await supabase.from('criteria').insert(subsToInsert);
      }
    }
  }

  // Create alternatives
  if (caseData.alternatives && caseData.alternatives.length > 0) {
    const altsToInsert = caseData.alternatives.map(a => ({
      id: a.id,
      case_id: caseRecord.id,
      name: a.name,
    }));
    await supabase.from('alternatives').insert(altsToInsert);
  }

  // Invite experts if provided
  if (caseData.experts && caseData.experts.length > 0) {
    // Find expert users by email (case-insensitive)
    const expertEmails = caseData.experts.map(e => e.email?.trim().toLowerCase());
    console.log('[CaseService] Inviting experts:', expertEmails);

    // Supabase ilike is case-insensitive, but we need to match all
    const { data: expertUsers, error: expertError } = await supabase
      .from('users')
      .select('id, email')
      .in('email', expertEmails);

    console.log('[CaseService] Found expert users:', expertUsers, 'Error:', expertError);

    if (expertUsers && expertUsers.length > 0) {
      const caseExpertsToInsert = expertUsers.map((expert) => ({
        case_id: caseRecord.id,
        expert_id: expert.id,
        weight: caseData.experts.find(e => e.email?.trim().toLowerCase() === expert.email.toLowerCase())?.weight || 1.0,
        status: 'invited',
      }));
      console.log('[CaseService] Inserting case_experts:', caseExpertsToInsert);

      const { error: insertError } = await supabase
        .from('case_experts')
        .insert(caseExpertsToInsert);

      if (insertError) {
        console.error('[CaseService] Error inserting case_experts:', insertError);
      } else {
        console.log('[CaseService] Case experts inserted successfully');
      }
    } else {
      console.log('[CaseService] No expert users found in database for emails:', expertEmails);
    }
  }

  // Store dependencies if ANP method
  if (caseData.dependencies && caseData.dependencies.length > 0) {
    const depsToInsert = caseData.dependencies.map(dep => ({
      case_id: caseRecord.id,
      from_criteria_id: dep.from,
      to_criteria_id: dep.to,
    }));

    const { error: depError } = await supabase.from('dependencies').insert(depsToInsert);
    if (depError) {
      console.error('[CaseService] Error inserting dependencies:', depError);
      // Non-critical error - continue without failing
    } else {
      console.log('[CaseService] Dependencies stored:', depsToInsert);
    }
  }

    return caseRecord;
  });
  return result.data;
};

const getCases = async (creatorId, filters = {}, limit = 20, offset = 0) => {
  let query = supabase
    .from('cases')
    .select('*')
    .eq('creator_id', creatorId)
    .is('deleted_at', null); // Exclude soft-deleted cases

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.method) query = query.eq('method', filters.method);
  if (filters.search) query = query.ilike('name', `%${filters.search}%`);

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  // Fetch related data for each case (limited to essential info)
  const casesWithData = await Promise.all(
    (data || []).map(async (caseRecord) => {
      const [
        { data: experts },
        { data: criteria },
        { data: alternatives },
      ] = await Promise.all([
        supabase.from('case_experts').select('expert_id, status, users(id, name, email, role)').eq('case_id', caseRecord.id),
        supabase.from('criteria').select('id, name, level').eq('case_id', caseRecord.id),
        supabase.from('alternatives').select('id, name').eq('case_id', caseRecord.id),
      ]);

      // Calculate progress: percentage of experts who have completed
      const totalExperts = experts?.length || 0;
      const completedExperts = experts?.filter(e => e.status === 'completed')?.length || 0;
      const progress = totalExperts > 0 ? Math.round((completedExperts / totalExperts) * 100) : 0;

      // If all experts completed and case is still active, mark as completed
      let updatedStatus = caseRecord.status;
      console.log(`[getCases] Case ${caseRecord.id}: ${completedExperts}/${totalExperts} experts completed, status=${caseRecord.status}, progress=${progress}%`);

      if (totalExperts > 0 && completedExperts === totalExperts && caseRecord.status === 'active') {
        console.log(`[getCases] Updating case ${caseRecord.id} to completed`);
        const { error: updateError } = await supabase
          .from('cases')
          .update({ status: 'completed' })
          .eq('id', caseRecord.id);
        if (!updateError) {
          console.log(`[getCases] Case ${caseRecord.id} updated to completed successfully`);
          updatedStatus = 'completed';
        } else {
          console.error(`[getCases] Failed to update case ${caseRecord.id}:`, updateError);
        }
      }

      return {
        ...caseRecord,
        status: updatedStatus,
        expertsCount: totalExperts,
        criteriaCount: criteria?.length || 0,
        alternativesCount: alternatives?.length || 0,
        progress,
      };
    })
  );

  return casesWithData;
};

// Shared authorization check: caller must be the case's creator or an
// invited expert. Returns which of those they are so callers can further
// restrict creator-only vs expert-only actions. Throws 404 (not 403) so
// unauthorized callers can't distinguish "doesn't exist" from "not yours".
const assertCaseAccess = async (caseId, userId) => {
  const { data: caseRecord, error } = await supabase
    .from('cases')
    .select('id, creator_id')
    .eq('id', caseId)
    .single();

  if (error || !caseRecord) {
    throw new CaseNotFoundError();
  }

  if (caseRecord.creator_id === userId) {
    return { role: 'creator', caseRecord };
  }

  const { data: expertInvite } = await supabase
    .from('case_experts')
    .select('case_id, expert_id')
    .eq('case_id', caseId)
    .eq('expert_id', userId)
    .single();

  if (!expertInvite) {
    throw new CaseNotFoundError();
  }

  return { role: 'expert', caseRecord };
};

const getCaseById = async (caseId, userId) => {
  const { data: caseRecord, error } = await supabase
    .from('cases')
    .select('*')
    .eq('id', caseId)
    .single();

  if (error || !caseRecord) {
    throw new CaseNotFoundError();
  }

  // Check if user is creator or invited expert
  if (caseRecord.creator_id !== userId) {
    const { data: expertInvite, error: expertError } = await supabase
      .from('case_experts')
      .select('case_id, expert_id')
      .eq('case_id', caseId)
      .eq('expert_id', userId)
      .single();

    console.log('[CaseService] Expert invite check:', { caseId, userId, expertInvite, expertError });

    if (!expertInvite) {
      throw new CaseNotFoundError();
    }
  }

  // Fetch related data
  const [goals, criteria, alternatives, experts] = await Promise.all([
    supabase.from('goals').select('*').eq('case_id', caseId),
    supabase.from('criteria').select('*').eq('case_id', caseId),
    supabase.from('alternatives').select('*').eq('case_id', caseId),
    supabase.from('case_experts').select('*, users(*)').eq('case_id', caseId),
  ]);

  return {
    ...caseRecord,
    goal: goals.data?.[0],
    criteria: criteria.data || [],
    alternatives: alternatives.data || [],
    experts: experts.data || [],
  };
};

const publishCase = async (caseId, userId) => {
  const { data, error } = await supabase
    .from('cases')
    .update({
      status: 'active',
      published_at: new Date().toISOString(),
    })
    .eq('id', caseId)
    .eq('creator_id', userId)
    .select()
    .single();

  if (error || !data) {
    throw new CaseNotFoundError();
  }

  // Audit log
  auditLog(userId, 'PUBLISH_CASE', 'cases', caseId, `Published case: ${data.name}`);

  return data;
};

const softDeleteCase = async (caseId, userId) => {
  // Verify user owns the case
  const { data: caseRecord, error: caseError } = await supabase
    .from('cases')
    .select('id, name, creator_id')
    .eq('id', caseId)
    .eq('creator_id', userId)
    .single();

  if (caseError || !caseRecord) {
    throw new CaseNotFoundError();
  }

  // Soft delete the case
  const { error: updateError } = await supabase
    .from('cases')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', caseId);

  if (updateError) throw updateError;

  // Audit log
  auditLog(userId, 'DELETE_CASE', 'cases', caseId, `Deleted case: ${caseRecord.name} (soft delete)`);

  return { success: true, message: 'Case deleted successfully' };
};

const restoreCase = async (caseId, userId) => {
  // Verify user owns the case. Look for the soft-deleted row specifically —
  // filtering on deleted_at IS NULL here meant a deleted case could never
  // be found, so restore always 404'd.
  const { data: caseRecord, error: caseError } = await supabase
    .from('cases')
    .select('id, name, creator_id')
    .eq('id', caseId)
    .eq('creator_id', userId)
    .not('deleted_at', 'is', null)
    .single();

  if (caseError || !caseRecord) {
    throw new CaseNotFoundError();
  }

  // Restore the case
  const { error: updateError } = await supabase
    .from('cases')
    .update({ deleted_at: null })
    .eq('id', caseId);

  if (updateError) throw updateError;

  // Audit log
  auditLog(userId, 'RESTORE_CASE', 'cases', caseId, `Restored case: ${caseRecord.name}`);

  return { success: true, message: 'Case restored successfully' };
};

module.exports = {
  createCase,
  getCases,
  getCaseById,
  publishCase,
  softDeleteCase,
  restoreCase,
  assertCaseAccess,
};
