const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const supabase = require('../config/supabase');
const {
  DuplicateEmailError,
  InvalidCredentialsError,
  InvalidTokenError,
} = require('../errors/AppErrors');

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: '10m' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, type: 'refresh' },
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
    return decoded;
  } catch (error) {
    throw new InvalidTokenError();
  }
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
};
