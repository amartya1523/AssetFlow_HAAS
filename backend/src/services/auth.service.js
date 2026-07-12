const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const config = require('../config/env');
const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

// ─── Helpers ───────────────────────────────────────────────────────────────

function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function generateToken(userId, role) {
  return jwt.sign({ userId, role }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}

// ─── Public methods ─────────────────────────────────────────────────────────

/**
 * Signup — always creates role EMPLOYEE. Never accepts a role from the
 * client (non-self-elevating).
 */
async function signup({ email, password, firstName, lastName, phone }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw ApiError.conflict('Email already registered');
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
      phone,
      role: 'EMPLOYEE', // always EMPLOYEE — non-self-elevating
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      createdAt: true,
    },
  });

  const token = generateToken(user.id, user.role);

  return { user, token };
}

/**
 * Login — validates credentials and returns JWT.
 */
async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (!user.isActive) {
    throw ApiError.forbidden('Account is disabled');
  }

  const token = generateToken(user.id, user.role);

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      avatarUrl: user.avatarUrl,
    },
    token,
  };
}

/**
 * Get current user — called from GET /auth/me after authenticate middleware.
 */
async function getMe(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      avatarUrl: true,
      isActive: true,
      department: { select: { id: true, name: true } },
      createdAt: true,
    },
  });

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  return user;
}

/**
 * Forgot password — generates a reset token and logs it to console.
 * In production this would send an email; for now it's a console stub.
 */
async function forgotPassword(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Don't reveal whether the email exists (prevent enumeration)
    return { message: 'If the email exists, a reset link has been logged to console' };
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: resetToken,
      passwordResetExpiresAt: resetExpiresAt,
    },
  });

  // Console stub — in production replace with email service
  // eslint-disable-next-line no-console
  console.log(`[FORGOT-PASSWORD] Reset token for ${email}: ${resetToken} (expires ${resetExpiresAt.toISOString()})`);

  return { message: 'If the email exists, a reset link has been logged to console' };
}

/**
 * Reset password — verifies token and updates password.
 */
async function resetPassword({ token, newPassword }) {
  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpiresAt: { gt: new Date() },
    },
  });

  if (!user) {
    throw ApiError.badRequest('Invalid or expired reset token');
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
    },
  });

  return { message: 'Password has been reset successfully' };
}

module.exports = {
  signup,
  login,
  getMe,
  forgotPassword,
  resetPassword,
};
