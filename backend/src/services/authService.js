const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const supabase = require('../config/supabase');
const {
  DuplicateEmailError,
  InvalidCredentialsError,
  InvalidTokenError,
} = require('../errors/AppErrors');

// Refresh-token denylist for logout + rotation. In-memory fallback works for
// single-instance; with REDIS_URL set, entries are also mirrored to Redis so
// multi-instance deployments share revocation. Entries expire naturally with
// the 7d refresh TTL (swept lazily on verify).
const revokedRefreshJtis = new Set();
let cacheService = null;
try {
  cacheService = require('./cacheService');
} catch (_) {
  cacheService = null;
}

const denyRefreshJti = async (jti) => {
  revokedRefreshJtis.add(jti);
  try {
    if (cacheService) await cacheService.set(`refresh:denied:${jti}`, 1, 7 * 24 * 60 * 60);
  } catch (_) { /* cache optional */ }
};

const isRefreshJtiDenied = async (jti) => {
  if (revokedRefreshJtis.has(jti)) return true;
  try {
    if (cacheService) {
      const hit = await cacheService.get(`refresh:denied:${jti}`);
      if (hit) {
        revokedRefreshJtis.add(jti);
        return true;
      }
    }
  } catch (_) { /* cache optional */ }
  return false;
};

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: '10m' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, type: 'refresh', jti: crypto.randomUUID() },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const generateToken = (user) => {
  return generateAccessToken(user);
};

const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    if (decoded.type !== 'refresh') {
      throw new InvalidTokenError();
    }
    if (decoded.jti && revokedRefreshJtis.has(decoded.jti)) {
      throw new InvalidTokenError();
    }
    return decoded;
  } catch (error) {
    throw new InvalidTokenError();
  }
};

const verifyRefreshTokenAsync = async (token) => {
  const decoded = verifyRefreshToken(token);
  if (decoded.jti && (await isRefreshJtiDenied(decoded.jti))) {
    throw new InvalidTokenError();
  }
  return decoded;
};

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

const verifyPassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

const registerCreator = async (data) => {
  // Check if email exists
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', data.email)
    .single();

  if (existing) {
    throw new DuplicateEmailError(data.email);
  }

  const passwordHash = await hashPassword(data.password);

  const { data: user, error } = await supabase
    .from('users')
    .insert({
      email: data.email,
      password_hash: passwordHash,
      name: data.name,
      institution: data.institution,
      role: 'creator',
      default_method: data.defaultMethod || 'AHP',
    })
    .select()
    .single();

  if (error) throw error;

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      institution: user.institution,
    },
    accessToken,
    refreshToken,
  };
};

const loginCreator = async (email, password) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .eq('role', 'creator')
    .single();

  if (error || !user) {
    throw new InvalidCredentialsError();
  }

  const passwordValid = await verifyPassword(password, user.password_hash);
  if (!passwordValid) {
    throw new InvalidCredentialsError();
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      institution: user.institution,
    },
    accessToken,
    refreshToken,
  };
};

const loginExpert = async (email, password) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .eq('role', 'expert')
    .single();

  if (error || !user) {
    throw new InvalidCredentialsError();
  }

  const passwordValid = await verifyPassword(password, user.password_hash);
  if (!passwordValid) {
    throw new InvalidCredentialsError();
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    accessToken,
    refreshToken,
  };
};

const getMe = async (userId) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, name, role, institution, default_method, created_at')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return user;
};

module.exports = {
  registerCreator,
  loginCreator,
  loginExpert,
  getMe,
  generateToken,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  verifyRefreshTokenAsync,
  revokeRefreshToken: denyRefreshJti,
  isRefreshRevoked: isRefreshJtiDenied,
};
