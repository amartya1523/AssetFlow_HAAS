const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendCreated } = require('../utils/apiResponse');
const authService = require('../services/auth.service');

/**
 * POST /api/v1/auth/signup
 * Always creates EMPLOYEE role — client cannot self-elevate.
 */
const signup = asyncHandler(async (req, res) => {
  const { user, token } = await authService.signup(req.body);
  return sendCreated(res, { user, token });
});

/**
 * POST /api/v1/auth/login
 * Returns 401 for invalid credentials.
 */
const login = asyncHandler(async (req, res) => {
  const { user, token } = await authService.login(req.body);
  return sendSuccess(res, { data: { user, token } });
});

/**
 * GET /api/v1/auth/me
 * Protected — requires valid JWT.
 */
const getMe = asyncHandler(async (req, res) => {
  // req.user is set by authenticate middleware
  const user = await authService.getMe(req.user.userId);
  return sendSuccess(res, { data: user });
});

/**
 * POST /api/v1/auth/forgot-password
 * Console stub for email (prevent email enumeration).
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body.email);
  return sendSuccess(res, { data: result });
});

/**
 * POST /api/v1/auth/reset-password
 */
const resetPassword = asyncHandler(async (req, res) => {
  const result = await authService.resetPassword(req.body);
  return sendSuccess(res, { data: result });
});

module.exports = { signup, login, getMe, forgotPassword, resetPassword };
