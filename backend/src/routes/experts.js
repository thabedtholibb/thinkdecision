const express = require('express');
const Joi = require('joi');
const authenticate = require('../middleware/authenticate');
const { requireRole } = require('../middleware/authorize');
const validate = require('../middleware/validate');
const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');
const { auditLog } = require('../services/auditService');

const router = express.Router();

// Only creators manage the expert directory: list/create/invite/reset-password.
// Experts only ever see their own dashboard (scoped by req.user.id below).
const requireCreator = requireRole('creator');

// Columns safe to return to the client — never include password_hash.
const PUBLIC_USER_COLUMNS = 'id, name, email, role, institution, default_method, created_at, updated_at';

const createExpertSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).optional(),
  email: Joi.string().trim().email().required(),
  role: Joi.string().optional(), // ignored - role is always forced to 'expert' below
  institution: Joi.string().trim().max(200).allow('').optional(),
});

const inviteExpertSchema = Joi.object({
  email: Joi.string().trim().email().required(),
});

// Generate random password with letters and numbers
const generateRandomPassword = () => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const allChars = uppercase + lowercase + numbers;

  let password = '';
  // Ensure at least 1 uppercase, 1 lowercase, 1 number
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];

  // Add 6 more random characters
  for (let i = 0; i < 6; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle password
  return password.split('').sort(() => 0.5 - Math.random()).join('');
};

// Hash password helper
const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  } catch (err) {
    console.error('Bcrypt error:', err);
    throw err;
  }
};

// Get all experts
router.get('/', authenticate, requireCreator, async (req, res) => {
  try {
    const { data: experts, error } = await supabase
      .from('users')
      .select('id, name, email, institution')
      .eq('role', 'expert')
      .order('name', { ascending: true });

    if (error) throw error;

    console.log('[Experts GET] Found experts:', experts);

    const formattedExperts = (experts || []).map(e => ({
      id: e.id,
      name: e.name,
      email: e.email,
      institution: e.institution,
      role: 'Expert',
      avatar_color: '#6366f1',
      status: 'active'
    }));

    res.json({
      success: true,
      data: formattedExperts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

// Create or update expert
router.post('/', authenticate, requireCreator, validate(createExpertSchema), async (req, res) => {
  const { name, email, institution } = req.validatedBody;
  const normalizedEmail = email.trim().toLowerCase();

  try {
    // Check if expert already exists (case-insensitive)
    const { data: existing, error: existingError } = await supabase
      .from('users')
      .select('id, name, email')
      .ilike('email', normalizedEmail)
      .single();

    if (existing) {
      // Expert already exists, just return it
      console.log('[Expert POST] Expert already exists:', normalizedEmail);
      return res.json({
        success: true,
        data: { id: existing.id, email: normalizedEmail, name: name || existing.name }
      });
    }

    // Generate temporary password
    const tempPassword = generateRandomPassword();
    const passwordHash = await hashPassword(tempPassword);

    // Create new expert user
    const { data: newExpert, error } = await supabase
      .from('users')
      .insert([{
        name: name || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        role: 'expert',
        institution: institution || '',
        password_hash: passwordHash
      }])
      .select(PUBLIC_USER_COLUMNS)
      .single();

    if (error) throw error;

    console.log('[Expert POST] Expert created:', normalizedEmail, newExpert.id);

    res.status(201).json({
      success: true,
      data: {
        ...newExpert,
        tempPassword // Return password so creator can share with expert
      }
    });
  } catch (error) {
    console.error('[Expert POST] Error:', error.message);

    // If user already exists, try to fetch it
    if (error.message.includes('duplicate') || error.message.includes('exists')) {
      const { data: existingUser } = await supabase
        .from('users')
        .select(PUBLIC_USER_COLUMNS)
        .ilike('email', normalizedEmail)
        .single();

      if (existingUser) {
        console.log('[Expert POST] Returning existing user after duplicate error');
        return res.json({
          success: true,
          data: existingUser
        });
      }
    }

    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

// Get active experts (in active cases)
router.get('/active', authenticate, requireCreator, async (req, res) => {
  try {
    const { data: activeExperts, error } = await supabase
      .from('case_experts')
      .select(`
        expert_id,
        status,
        users (id, name, email, institution)
      `)
      .in('status', ['invited', 'in_progress']);

    if (error) throw error;

    const formatted = (activeExperts || []).map(ce => ({
      id: ce.users?.id,
      name: ce.users?.name,
      email: ce.users?.email,
      institution: ce.users?.institution,
      role: 'Expert',
      avatar_color: '#6366f1',
      status: ce.status === 'in_progress' ? 'Mengisi' : 'Diundang'
    })).filter(e => e.id);

    // Remove duplicates
    const unique = Array.from(new Map(formatted.map(e => [e.id, e])).values());

    res.json({
      success: true,
      data: unique
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

// Invite expert
router.post('/invite', authenticate, requireCreator, validate(inviteExpertSchema), async (req, res) => {
  try {
    const { email } = req.validatedBody;

    // Create expert user if doesn't exist
    const { data: expert } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()
      .catch(() => ({ data: null }));

    let expertId = expert?.id;

    let tempPassword = null;
    if (!expertId) {
      tempPassword = generateRandomPassword();
      const passwordHash = await hashPassword(tempPassword);

      const { data: newExpert, error: createError } = await supabase
        .from('users')
        .insert([{
          email,
          name: email.split('@')[0],
          role: 'expert',
          password_hash: passwordHash
        }])
        .select(PUBLIC_USER_COLUMNS)
        .single();

      if (createError && !createError.message.includes('duplicate')) throw createError;
      expertId = newExpert?.id;
    }

    res.json({
      success: true,
      data: { expertId, email, tempPassword }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

function generateColor() {
  const colors = ['#6366f1', '#0ea5e9', '#f59e0b', '#a855f7', '#ef4444', '#14b8a6', '#ec4899', '#06b6d4'];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Reset expert password endpoint
// Creator-only. NOTE: the new password is still returned in the response body
// (not emailed) because this app has no outbound email service — the creator
// is expected to relay it to the expert out-of-band. Every reset is audit-logged.
router.post('/:expertId/reset-password', authenticate, requireCreator, async (req, res) => {
  try {
    const { expertId } = req.params;

    const { data: targetExpert, error: lookupError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', expertId)
      .single();

    if (lookupError || !targetExpert || targetExpert.role !== 'expert') {
      return res.status(404).json({
        success: false,
        error: { message: 'Expert not found' }
      });
    }

    const newPassword = generateRandomPassword();
    const passwordHash = await hashPassword(newPassword);

    const { data: updatedExpert, error } = await supabase
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('id', expertId)
      .select(PUBLIC_USER_COLUMNS)
      .single();

    if (error) throw error;

    auditLog(
      req.user.id,
      'RESET_EXPERT_PASSWORD',
      'users',
      expertId,
      `Password reset for expert ${targetExpert.email} by creator ${req.user.email}`
    );

    res.json({
      success: true,
      message: 'Password berhasil direset',
      data: {
        ...updatedExpert,
        tempPassword: newPassword
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

router.get('/dashboard', authenticate, async (req, res) => {
  console.log('[Dashboard] Expert user:', req.user.id, req.user.email);

  // Get expert's case invitations
  // Use explicit relationship name to avoid ambiguity between creator and expert relationships
  const { data: invitations, error: invError } = await supabase
    .from('case_experts')
    .select(`
      case_id,
      status,
      cases (id, name, method, deadline, creator_id, users!cases_creator_id_fkey(name, institution))
    `)
    .eq('expert_id', req.user.id)
    .in('status', ['invited', 'in_progress', 'completed']);

  console.log('[Dashboard] Invitations:', invitations, 'Error:', invError);

  // Get stats
  const { data: stats } = await supabase
    .from('case_experts')
    .select('status, case_id, consistency_ratios(cr)')
    .eq('expert_id', req.user.id);

  console.log('[Dashboard] Stats:', stats);

  const activeCases = stats?.filter(s => s.status === 'in_progress').length || 0;
  const completedCases = stats?.filter(s => s.status === 'completed').length || 0;
  const avgCR = stats && stats.length > 0
    ? stats.reduce((sum, s) => sum + (s.consistency_ratios?.[0]?.cr || 0), 0) / stats.length
    : 0;

  res.json({
    success: true,
    data: {
      stats: {
        activeCases,
        completedCases,
        avgCR,
        totalContributions: stats?.length || 0,
      },
      invitations: invitations || [],
    },
  });
});

module.exports = router;
