const express = require('express');
const Joi = require('joi');
const authService = require('../services/authService');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const asyncHandler = require('../middleware/asyncHandler');
const { AppError } = require('../middleware/errorHandler');
const { authLogger } = require('../services/loggerService');

const router = express.Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new creator account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, institution, email, password]
 *             properties:
 *               name: { type: string, example: "John Creator" }
 *               institution: { type: string, example: "IPB University" }
 *               email: { type: string, format: email, example: "creator@example.com" }
 *               password: { type: string, example: "secure_password_123" }
 *               defaultMethod: { type: string, enum: [AHP, ANP], example: "AHP" }
 *     responses:
 *       201:
 *         description: Creator registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { $ref: '#/components/schemas/User' }
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already registered
 */

/**
 * @swagger
 * /auth/login/creator:
 *   post:
 *     summary: Login as creator
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: authToken=jwt_token; Path=/; HttpOnly; Secure; SameSite=Strict
 *       401:
 *         description: Invalid credentials
 *       429:
 *         description: Too many login attempts
 */

/**
 * @swagger
 * /auth/login/expert:
 *   post:
 *     summary: Login as expert
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful
 */

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Refresh token expired or missing
 */

const registerSchema = Joi.object({
  name: Joi.string().required(),
  institution: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  defaultMethod: Joi.string().valid('AHP', 'ANP', 'Fuzzy AHP', 'Fuzzy ANP'),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

router.post('/register', validate(registerSchema), asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.registerCreator(req.validatedBody);

  authLogger.info('Creator registered', {
    userId: user.id,
    email: user.email,
    name: user.name,
    ip: req.ip,
  });

  // Set httpOnly cookies
  res.cookie('authToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'none',
    maxAge: 10 * 60 * 1000 // 10 minutes
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'none',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.status(201).json({
    success: true,
    message: 'Creator registered successfully',
    data: user,
  });
}));

router.post('/login/creator', validate(loginSchema), asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.loginCreator(
    req.validatedBody.email,
    req.validatedBody.password
  );

  authLogger.info('Creator logged in', {
    userId: user.id,
    email: user.email,
    ip: req.ip,
  });

  // Set httpOnly cookies
  res.cookie('authToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'none',
    maxAge: 10 * 60 * 1000 // 10 minutes
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'none',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  console.log('[Auth] Cookies set - authToken and refreshToken for user:', user.email);

  res.json({
    success: true,
    data: user,
    token: accessToken, // Return token untuk frontend store & kirim sebagai header
  });
}));

router.post('/login/expert', validate(loginSchema), asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.loginExpert(
    req.validatedBody.email,
    req.validatedBody.password
  );

  // Set httpOnly cookies
  res.cookie('authToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'none',
    maxAge: 10 * 60 * 1000 // 10 minutes
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'none',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.json({
    success: true,
    data: user,
    token: accessToken, // Return token untuk frontend store & kirim sebagai header
  });
}));

router.post('/logout', authenticate, asyncHandler(async (req, res) => {
  authLogger.info('User logged out', {
    userId: req.user.id,
    email: req.user.email,
    ip: req.ip,
  });

  res.clearCookie('authToken');
  res.clearCookie('refreshToken');
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
}));

router.post('/refresh', asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    authLogger.warn('Refresh token missing', { ip: req.ip });
    throw new AppError('Refresh token not found', 401, 'NO_REFRESH_TOKEN');
  }

  const decoded = authService.verifyRefreshToken(refreshToken);

  // Get user data
  const user = await authService.getMe(decoded.id);

  authLogger.info('Token refreshed', {
    userId: user.id,
    email: user.email,
    ip: req.ip,
  });

  // Generate new access token
  const newAccessToken = authService.generateAccessToken({
    id: user.id,
    email: user.email,
    role: user.role
  });

  // Set new access token cookie
  res.cookie('authToken', newAccessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000 // 10 minutes
  });

  res.json({
    success: true,
    message: 'Token refreshed successfully',
    data: user
  });
}));

module.exports = router;
