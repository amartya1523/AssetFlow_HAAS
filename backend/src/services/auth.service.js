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

function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// ─── Public methods ─────────────────────────────────────────────────────────

/**
 * Signup — always creates role EMPLOYEE. Never accepts a role from the
 * client (non-self-elevating).
 */
async function signup({ name, email, password, firstName, lastName, phone }) {
  const normalizedName = (
    name?.trim() || [firstName, lastName].filter(Boolean).join(' ').trim()
  );

  if (!normalizedName) {
    throw ApiError.badRequest('Name is required');
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw ApiError.conflict('Email already registered');
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name: normalizedName,
      email,
      passwordHash,
      phone,
      role: 'EMPLOYEE', // always EMPLOYEE — non-self-elevating
      status: 'ACTIVE',
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
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

  if (user.status !== 'ACTIVE') {
    throw ApiError.forbidden('Account is disabled');
  }

  const token = generateToken(user.id, user.role);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
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
      name: true,
      email: true,
      phone: true,
      role: true,
      avatarUrl: true,
      status: true,
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
  const resetTokenHash = hashResetToken(resetToken);
  const resetExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetTokenHash: resetTokenHash,
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
  const hashedToken = hashResetToken(token);

  const user = await prisma.user.findFirst({
    where: {
      passwordResetTokenHash: hashedToken,
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
      passwordResetTokenHash: null,
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
