const crypto = require('crypto');
const supabase = require('../config/supabase');
const { AppError } = require('../middleware/errorHandler');
const { CaseNotFoundError } = require('../errors/AppErrors');
const { auditLog } = require('./auditService');
const { withTransaction } = require('../middleware/transaction');
const cacheService = require('./cacheService');

// A1: status is derived truth, not just a stored label. 'completed' holds
// only while every invited expert is completed; a stored 'completed' with
// incomplete experts (e.g. after a structure edit reset) resolves back to
// the live state instead of showing stale success.
const resolveCaseStatus = (stored, experts, publishedAt) => {
  const list = experts || [];
  if (list.length > 0 && list.every((e) => e.status === 'completed')) return 'completed';
  if (stored === 'completed') return publishedAt ? 'active' : 'draft';
  return stored;
};

const CASE_DETAIL_COLUMNS =
  'id,creator_id,name,description,objective,method,status,deadline,published_at,created_at,updated_at';
const CASE_DETAIL_COLUMNS_WITH_GOAL = `${CASE_DETAIL_COLUMNS},goal_name`;

// A4: cases.goal_name (migration 2025100105) folds the 1-to-1 goals table
// into the case row. Tolerant read: works before the column exists.
const selectCaseDetail = async (caseId) => {
  const withGoal = await supabase
    .from('cases')
    .select(CASE_DETAIL_COLUMNS_WITH_GOAL)
    .eq('id', caseId)
    .single();
  if (!withGoal.error) return withGoal;
  if (String(withGoal.error.message || '').includes('goal_name')) {
    return supabase.from('cases').select(CASE_DETAIL_COLUMNS).eq('id', caseId).single();
  }
  return withGoal;
};

// Shared structure writers (used by updateCase; createCase keeps its own
// inline flow untouched). IDs supplied by the caller are treated as opaque
// mapping keys: matching existing rows keep their IDs (so judgment level
// keys like 'alt-<id>' stay valid), unknown ones get fresh UUIDs.
const insertCriteria = async (caseId, criteria, existingIds = new Set()) => {
  const critIdMap = new Map();
  const toInsert = (criteria || []).map((c) => {
    const finalId = existingIds.has(String(c.id)) ? String(c.id) : crypto.randomUUID();
    critIdMap.set(String(c.id), finalId);
    return {
      id: finalId,
      case_id: caseId,
      name: c.name,
      description: c.description ?? c.desc ?? null,
      level: 1,
    };
  });
  if (toInsert.length > 0) {
    const { error } = await supabase.from('criteria').insert(toInsert);
    if (error) throw new AppError('Failed to create criteria: ' + error.message, 400, 'CRITERIA_CREATE_ERROR');
  }
  for (const c of criteria || []) {
    if (c.subs && c.subs.length > 0) {
      const parentId = critIdMap.get(String(c.id));
      const subsToInsert = c.subs.map((s) => ({
        id: existingIds.has(String(s.id)) ? String(s.id) : crypto.randomUUID(),
        case_id: caseId,
        parent_criteria_id: parentId,
        name: s.name,
        level: 2,
      }));
      const { error } = await supabase.from('criteria').insert(subsToInsert);
      if (error) throw new AppError('Failed to create sub-criteria: ' + error.message, 400, 'SUBCRITERIA_CREATE_ERROR');
    }
  }
  return critIdMap;
};

const insertAlternatives = async (caseId, alternatives, existingIds = new Set()) => {
  const toInsert = (alternatives || []).map((a) => ({
    id: existingIds.has(String(a.id)) ? String(a.id) : crypto.randomUUID(),
    case_id: caseId,
    name: a.name,
  }));
  if (toInsert.length > 0) {
    const { error } = await supabase.from('alternatives').insert(toInsert);
    if (error) throw new AppError('Failed to create alternatives: ' + error.message, 400, 'ALTERNATIVES_CREATE_ERROR');
  }
};

const insertDependencies = async (caseId, dependencies, critIdMap) => {
  const toInsert = [];
  for (const dep of dependencies || []) {
    const fromId = critIdMap.get(String(dep.from));
    const toId = critIdMap.get(String(dep.to));
    if (!fromId || !toId) {
      throw new AppError(`Invalid dependency ${dep.from} -> ${dep.to}: unknown criteria id`, 400, 'DEPENDENCY_INVALID');
    }
    toInsert.push({ case_id: caseId, from_criteria_id: fromId, to_criteria_id: toId });
  }
  if (toInsert.length > 0) {
    const { error } = await supabase.from('dependencies').insert(toInsert);
    if (error) throw new AppError('Failed to store dependencies: ' + error.message, 400, 'DEPENDENCY_CREATE_ERROR');
  }
};

// Sync expert list: update weights, invite new (existing users only), remove
// experts that have no submitted judgments. Returns invited/failed like create.
const syncExperts = async (caseId, expertsList) => {
  const invitedExperts = [];
  const failedExperts = [];
  const wanted = (expertsList || []).map((e) => ({
    email: e.email?.trim().toLowerCase(),
    weight: e.weight || 1.0,
  })).filter((e) => e.email);

  const { data: current } = await supabase
    .from('case_experts')
    .select('expert_id, weight, users!inner(id, email)')
    .eq('case_id', caseId);
  const currentByEmail = new Map((current || []).map((r) => [String(r.users.email).toLowerCase(), r]));

  // Removals (only when the expert never submitted)
  for (const [email, row] of currentByEmail) {
    if (!wanted.some((w) => w.email === email)) {
      const { count } = await supabase.from('judgments')
        .select('id', { count: 'exact', head: true })
        .eq('case_id', caseId).eq('expert_id', row.expert_id).eq('submitted', true);
      if (count > 0) {
        throw new AppError(`Cannot remove expert ${email} after they submitted judgments`, 409, 'EXPERT_LOCKED');
      }
      await supabase.from('case_experts').delete().eq('case_id', caseId).eq('expert_id', row.expert_id);
    }
  }

  if (wanted.length > 0) {
    const { data: foundUsers } = await supabase
      .from('users').select('id, email').in('email', wanted.map((w) => w.email));
    const foundByEmail = new Map((foundUsers || []).map((u) => [u.email.toLowerCase(), u]));
    for (const w of wanted) {
      const user = foundByEmail.get(w.email);
      if (!user) {
        failedExperts.push(w.email);
        continue;
      }
      invitedExperts.push(w.email);
      if (currentByEmail.has(w.email)) {
        await supabase.from('case_experts').update({ weight: w.weight }).eq('case_id', caseId).eq('expert_id', user.id);
      } else {
        const { error } = await supabase.from('case_experts').insert({
          case_id: caseId, expert_id: user.id, weight: w.weight, status: 'invited',
        });
        if (error && !String(error.message).includes('duplicate')) {
          throw new AppError('Failed to invite experts: ' + error.message, 500, 'EXPERT_INSERT_ERROR');
        }
      }
    }
  }
  return { invitedExperts, failedExperts };
};

const createCase = async (creatorId, caseData) => {
  // withTransaction wraps the operation's return value as { success, data,
  // duration } — unwrap .data here so callers (cases.js) get the actual case
  // record. Without this, `caseRecord.id` was always undefined and
  // POST /cases/publish always 404'd on the immediately-following publishCase call.
  const result = await withTransaction('createCase', async () => {
    let caseRecord = null;
    try {
    // Create case (goal_name folded in when migration 2025100105 applied;
    // falls back to a column-less insert so deploy order doesn't matter).
    const baseRow = {
      creator_id: creatorId,
      name: caseData.name,
      description: caseData.description,
      objective: caseData.objective,
      method: caseData.method,
      deadline: caseData.deadline,
      status: 'draft',
    };
    let created = null;
    let caseError = null;
    if (caseData.goal?.name) {
      const attempt = await supabase
        .from('cases')
        .insert({ ...baseRow, goal_name: caseData.goal.name })
        .select()
        .single();
      created = attempt.data;
      caseError = attempt.error;
      if (caseError && String(caseError.message || '').includes('goal_name')) {
        const retry = await supabase.from('cases').insert(baseRow).select().single();
        created = retry.data;
        caseError = retry.error;
      }
    } else {
      const attempt = await supabase.from('cases').insert(baseRow).select().single();
      created = attempt.data;
      caseError = attempt.error;
    }

    if (caseError) throw new AppError('Failed to create case: ' + caseError.message, 400, 'CASE_CREATE_ERROR');
    caseRecord = created;

  // Create goal
  if (caseData.goal) {
    const { error: goalError } = await supabase.from('goals').insert({
      case_id: caseRecord.id,
      name: caseData.goal.name,
    });
    if (goalError) throw new AppError('Failed to create goal: ' + goalError.message, 400, 'GOAL_CREATE_ERROR');
  }

  // Create criteria — IDs are generated server-side so a client can't collide
  // with another case's rows or forge parent/dependency links. Client-supplied
  // ids are only used as mapping keys within this payload. Accepts both
  // `description` and legacy wizard `desc` (A7: previously desc-only rows
  // stored NULL and the text was silently lost).
  const critIdMap = new Map(); // clientId -> server UUID
  if (caseData.criteria && caseData.criteria.length > 0) {
    const criteriasToInsert = caseData.criteria.map(c => {
      const serverId = crypto.randomUUID();
      critIdMap.set(String(c.id), serverId);
      return {
        id: serverId,
        case_id: caseRecord.id,
        name: c.name,
        description: c.description ?? c.desc ?? null,
        level: 1,
      };
    });

    const { error: critError } = await supabase.from('criteria').insert(criteriasToInsert);
    if (critError) throw new AppError('Failed to create criteria: ' + critError.message, 400, 'CRITERIA_CREATE_ERROR');

    // Create sub-criteria
    for (const criterion of caseData.criteria) {
      if (criterion.subs && criterion.subs.length > 0) {
        const parentServerId = critIdMap.get(String(criterion.id));
        const subsToInsert = criterion.subs.map(s => ({
          id: crypto.randomUUID(),
          case_id: caseRecord.id,
          parent_criteria_id: parentServerId,
          name: s.name,
          level: 2,
        }));
        const { error: subError } = await supabase.from('criteria').insert(subsToInsert);
        if (subError) throw new AppError('Failed to create sub-criteria: ' + subError.message, 400, 'SUBCRITERIA_CREATE_ERROR');
      }
    }
  }

  // Create alternatives (server-side UUIDs)
  if (caseData.alternatives && caseData.alternatives.length > 0) {
    const altsToInsert = caseData.alternatives.map(a => ({
      id: crypto.randomUUID(),
      case_id: caseRecord.id,
      name: a.name,
    }));
    const { error: altError } = await supabase.from('alternatives').insert(altsToInsert);
    if (altError) throw new AppError('Failed to create alternatives: ' + altError.message, 400, 'ALTERNATIVES_CREATE_ERROR');
  }

  // Invite experts if provided
  const invitedExperts = [];
  const failedExperts = [];
  if (caseData.experts && caseData.experts.length > 0) {
    const requestedEmails = caseData.experts.map(e => e.email?.trim().toLowerCase());
    console.log('[CaseService] Inviting experts:', requestedEmails);

    const { data: foundUsers, error: expertError } = await supabase
      .from('users')
      .select('id, email')
      .in('email', requestedEmails);

    console.log('[CaseService] Found expert users:', foundUsers, 'Error:', expertError);

    const foundEmails = (foundUsers || []).map(u => u.email.toLowerCase());

    requestedEmails.forEach(email => {
      if (foundEmails.includes(email)) {
        invitedExperts.push(email);
      } else {
        failedExperts.push(email);
      }
    });

    if (foundUsers && foundUsers.length > 0) {
      const caseExpertsToInsert = foundUsers.map((expert) => ({
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
        // This is a critical error within the transaction, rethrow it
        throw new AppError('Failed to invite experts: ' + insertError.message, 500, 'EXPERT_INSERT_ERROR');
      } else {
        console.log('[CaseService] Case experts inserted successfully');
      }
    }
  }

  // Store dependencies if ANP method — remapped to server-side criteria IDs;
  // unknown from/to values are rejected instead of stored as orphans.
  if (caseData.dependencies && caseData.dependencies.length > 0) {
    const depsToInsert = [];
    for (const dep of caseData.dependencies) {
      const fromId = critIdMap.get(String(dep.from));
      const toId = critIdMap.get(String(dep.to));
      if (!fromId || !toId) {
        throw new AppError(
          `Invalid dependency ${dep.from} -> ${dep.to}: unknown criteria id`,
          400,
          'DEPENDENCY_INVALID'
        );
      }
      depsToInsert.push({
        case_id: caseRecord.id,
        from_criteria_id: fromId,
        to_criteria_id: toId,
      });
    }

    const { error: depError } = await supabase.from('dependencies').insert(depsToInsert);
    if (depError) {
      throw new AppError('Failed to store dependencies: ' + depError.message, 400, 'DEPENDENCY_CREATE_ERROR');
    } else {
      console.log('[CaseService] Dependencies stored:', depsToInsert.length);
    }
  }

    return { caseRecord, invitedExperts, failedExperts, critIdMap };
    } catch (err) {
      // Compensating rollback: Supabase REST has no multi-statement transaction,
      // so delete the partially-created case (children cascade or are removed
      // best-effort) instead of leaving an orphan draft.
      if (caseRecord?.id) {
        try {
          await supabase.from('dependencies').delete().eq('case_id', caseRecord.id);
          await supabase.from('case_experts').delete().eq('case_id', caseRecord.id);
          await supabase.from('alternatives').delete().eq('case_id', caseRecord.id);
          await supabase.from('criteria').delete().eq('case_id', caseRecord.id);
          await supabase.from('goals').delete().eq('case_id', caseRecord.id);
          await supabase.from('cases').delete().eq('id', caseRecord.id);
          console.log('[CaseService] Rolled back partial case:', caseRecord.id);
        } catch (rbErr) {
          console.error('[CaseService] Rollback failed for case:', caseRecord.id, rbErr?.message);
        }
      }
      throw err;
    }
  });
  return {
    data: result.data.caseRecord,
    invited: result.data.invitedExperts,
    failed: result.data.failedExperts,
    // Server-side ID mapping (client criteria id -> server UUID) so the
    // frontend can rebuild sub-/alt- level keys from authoritative IDs.
    criteriaIdMap: Object.fromEntries(result.data.critIdMap || []),
  };
};

const getCases = async (creatorId, filters = {}, limit = 20, offset = 0) => {
  let query = supabase
    .from('cases')
    .select('id,name,description,objective,method,status,deadline,published_at,created_at')
    .eq('creator_id', creatorId)
    .is('deleted_at', null); // Exclude soft-deleted cases

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.method) query = query.eq('method', filters.method);
  if (filters.search) {
    const escaped = String(filters.search).replace(/[%_\\]/g, '\\$&');
    query = query.ilike('name', `%${escaped}%`);
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  if (!data || data.length === 0) return [];

  // Single roundtrip: embed children counts instead of 3 queries per case
  // (previously 1 + 3N queries — 151 roundtrips for a 50-case page).
  const { data: embedded, error: embError } = await supabase
    .from('cases')
    .select('id, case_experts(expert_id, status), criteria(id), alternatives(id)')
    .in('id', (data || []).map((c) => c.id));

  if (embError) throw embError;

  const byId = new Map((embedded || []).map((c) => [c.id, c]));

  return (data || []).map((caseRecord) => {
    const emb = byId.get(caseRecord.id) || {};
    const experts = emb.case_experts || [];
    const completedExperts = experts.filter((e) => e.status === 'completed').length;
    const totalExperts = experts.length;
    return {
      ...caseRecord,
      status: resolveCaseStatus(caseRecord.status, experts, caseRecord.published_at),
      expertsCount: totalExperts,
      criteriaCount: (emb.criteria || []).length,
      alternativesCount: (emb.alternatives || []).length,
      progress: totalExperts > 0 ? Math.round((completedExperts / totalExperts) * 100) : 0,
    };
  });
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
  const { data: caseRecord, error } = await selectCaseDetail(caseId);

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

  // Fetch related data (explicit columns — judgments.matrix JSONB is large
  // and must only travel where aggregation actually needs it)
  const [goals, criteria, alternatives, experts, dependencies] = await Promise.all([
    supabase.from('goals').select('id,case_id,name').eq('case_id', caseId),
    supabase.from('criteria').select('id,case_id,parent_criteria_id,name,description,level').eq('case_id', caseId),
    supabase.from('alternatives').select('id,case_id,name').eq('case_id', caseId),
    supabase.from('case_experts').select('expert_id,status,weight,users(id,name,email,role,institution)').eq('case_id', caseId),
    supabase.from('dependencies').select('id,case_id,from_criteria_id,to_criteria_id').eq('case_id', caseId),
  ]);

  return {
    ...caseRecord,
    status: resolveCaseStatus(caseRecord.status, experts.data || [], caseRecord.published_at),
    // A4: prefer the folded column; fall back to the legacy goals row.
    goal: caseRecord.goal_name ? { name: caseRecord.goal_name } : goals.data?.[0],
    criteria: criteria.data || [],
    alternatives: alternatives.data || [],
    experts: experts.data || [],
    dependencies: dependencies.data || [],
  };
};

const updateCase = async (caseId, userId, caseData, meta = {}) => {
  const { data: existing, error } = await supabase
    .from('cases')
    .select('id, creator_id, method, status')
    .eq('id', caseId)
    .eq('creator_id', userId)
    .single();

  if (error || !existing) {
    throw new CaseNotFoundError();
  }

  const { count: submittedCount } = await supabase
    .from('judgments')
    .select('id', { count: 'exact', head: true })
    .eq('case_id', caseId)
    .eq('submitted', true);

  // Scalar info fields are always editable
  const patch = {};
  ['name', 'description', 'objective', 'deadline'].forEach((k) => {
    if (caseData[k] !== undefined) patch[k] = caseData[k];
  });
  if (caseData.method && caseData.method !== existing.method) {
    if (submittedCount > 0) {
      throw new AppError('Cannot change method after experts submitted judgments', 409, 'METHOD_LOCKED');
    }
    patch.method = caseData.method;
  }
  if (Object.keys(patch).length > 0) {
    const { error: upErr } = await supabase.from('cases').update(patch).eq('id', caseId);
    if (upErr) throw new AppError('Failed to update case: ' + upErr.message, 400, 'CASE_UPDATE_ERROR');
  }

  if (caseData.goal?.name) {
    const { data: goalRow } = await supabase.from('goals').select('id').eq('case_id', caseId).single();
    if (goalRow) {
      await supabase.from('goals').update({ name: caseData.goal.name }).eq('case_id', caseId);
    } else {
      await supabase.from('goals').insert({ case_id: caseId, name: caseData.goal.name });
    }
    // A4 dual-write: folded column when migration 2025100105 applied; ignore
    // missing-column error so deploy order doesn't matter.
    try {
      const { error: goalColErr } = await supabase
        .from('cases').update({ goal_name: caseData.goal.name }).eq('id', caseId);
      if (goalColErr && !String(goalColErr.message || '').includes('goal_name')) throw goalColErr;
    } catch (e) {
      if (!String(e?.message || '').includes('goal_name')) throw e;
    }
  }

  // Structure (criteria/alternatives/dependencies) locks once judgments are submitted
  const wantsStructure = caseData.criteria !== undefined || caseData.alternatives !== undefined;
  if (wantsStructure) {
    if (submittedCount > 0) {
      throw new AppError(
        'Cannot change criteria/alternatives after experts submitted judgments (info fields remain editable)',
        409,
        'STRUCTURE_LOCKED'
      );
    }
    // Discard drafts + CRs, reset expert progress, then replace structure
    await supabase.from('judgments').delete().eq('case_id', caseId);
    await supabase.from('consistency_ratios').delete().eq('case_id', caseId);
    await supabase.from('case_experts').update({ status: 'invited', completed_at: null }).eq('case_id', caseId);
    await supabase.from('dependencies').delete().eq('case_id', caseId);
    await supabase.from('criteria').delete().eq('case_id', caseId);
    await supabase.from('alternatives').delete().eq('case_id', caseId);

    const critIdMap = await insertCriteria(caseId, caseData.criteria || [], new Set());
    await insertAlternatives(caseId, caseData.alternatives || [], new Set());
    await insertDependencies(caseId, caseData.dependencies || [], critIdMap);
    // A1: a structure edit resets expert progress, so a stored 'completed'
    // must reopen to 'active' — reads derive it anyway, this keeps the column honest.
    if (existing.status === 'completed') {
      await supabase.from('cases').update({ status: 'active' }).eq('id', caseId);
    }
    try {
      await cacheService.invalidateCase(caseId);
    } catch (_) { /* cache optional */ }
  }

  let invited = [];
  let failed = [];
  if (caseData.experts !== undefined) {
    const synced = await syncExperts(caseId, caseData.experts);
    invited = synced.invitedExperts;
    failed = synced.failedExperts;
  }

  await auditLog(userId, 'UPDATE_CASE', 'cases', caseId, 'Updated case', null, meta.ip || null, meta.ua || null);

  const full = await getCaseById(caseId, userId);
  return { data: full, invited, failed };
};

const publishCase = async (caseId, userId, meta = {}) => {
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
  await auditLog(userId, 'PUBLISH_CASE', 'cases', caseId, `Published case: ${data.name}`, null, meta.ip || null, meta.ua || null);

  return data;
};

const softDeleteCase = async (caseId, userId, meta = {}) => {
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
  await auditLog(userId, 'DELETE_CASE', 'cases', caseId, `Deleted case: ${caseRecord.name} (soft delete)`, null, meta.ip || null, meta.ua || null);

  return { success: true, message: 'Case deleted successfully' };
};

const restoreCase = async (caseId, userId, meta = {}) => {
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
  await auditLog(userId, 'RESTORE_CASE', 'cases', caseId, `Restored case: ${caseRecord.name}`, null, meta.ip || null, meta.ua || null);

  return { success: true, message: 'Case restored successfully' };
};

module.exports = {
  createCase,
  updateCase,
  getCases,
  getCaseById,
  publishCase,
  softDeleteCase,
  restoreCase,
  assertCaseAccess,
};
