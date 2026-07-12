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

function generateToken(userId, role, organizationId = null) {
  return jwt.sign({ userId, role, organizationId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}

function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function makeSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

async function buildUniqueOrganizationSlug(name, tx = prisma) {
  const base = makeSlug(name) || `org-${crypto.randomBytes(3).toString('hex')}`;
  let slug = base;
  let suffix = 2;

  // Keep this deterministic and readable for tenant URLs/admin views.
  // eslint-disable-next-line no-await-in-loop
  while (await tx.organization.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

function serializeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    avatarUrl: user.avatarUrl,
    organizationId: user.organizationId,
    organization: user.organization || null,
    department: user.department || null,
    createdAt: user.createdAt,
  };
}

// ─── Public methods ─────────────────────────────────────────────────────────

/**
 * Signup creates a new tenant organization and its first ADMIN user.
 */
async function signup({
  name,
  email,
  password,
  firstName,
  lastName,
  phone,
  organizationName,
  companyName,
}) {
  const normalizedName = (
    name?.trim() || [firstName, lastName].filter(Boolean).join(' ').trim()
  );
  const normalizedOrganizationName = (organizationName || companyName || '').trim();

  if (!normalizedName) {
    throw ApiError.badRequest('Name is required');
  }
  if (!normalizedOrganizationName) {
    throw ApiError.badRequest('Organization name is required');
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw ApiError.conflict('Email already registered');
  }

  const passwordHash = await hashPassword(password);

  const { user, organization } = await prisma.$transaction(async (tx) => {
    const slug = await buildUniqueOrganizationSlug(normalizedOrganizationName, tx);
    const createdOrganization = await tx.organization.create({
      data: {
        name: normalizedOrganizationName,
        slug,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        createdAt: true,
      },
    });

    const createdUser = await tx.user.create({
      data: {
        name: normalizedName,
        email,
        passwordHash,
        phone,
        role: 'ADMIN',
        status: 'ACTIVE',
        organizationId: createdOrganization.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        avatarUrl: true,
        organizationId: true,
        createdAt: true,
        organization: {
          select: { id: true, name: true, slug: true, status: true },
        },
      },
    });

    await tx.activityLog.create({
      data: {
        organizationId: createdOrganization.id,
        userId: createdUser.id,
        action: 'ORGANIZATION_SIGNUP',
        entityType: 'Organization',
        entityId: createdOrganization.id,
        metadata: { organizationName: createdOrganization.name },
      },
    });

    return { user: createdUser, organization: createdOrganization };
  });

  const token = generateToken(user.id, user.role, user.organizationId);

  return { user: serializeUser(user), organization, token };
}

/**
 * Login — validates credentials and returns JWT.
 */
async function login({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      organization: {
        select: { id: true, name: true, slug: true, status: true },
      },
      department: {
        select: { id: true, name: true, code: true },
      },
    },
  });
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
  if (user.role !== 'SUPER_ADMIN' && user.organization?.status === 'INACTIVE') {
    throw ApiError.forbidden('Organization is inactive');
  }

  const token = generateToken(user.id, user.role, user.organizationId);

  return {
    user: serializeUser(user),
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
      organizationId: true,
      organization: { select: { id: true, name: true, slug: true, status: true } },
      department: { select: { id: true, name: true, code: true } },
      createdAt: true,
    },
  });

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  return serializeUser(user);
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
  generateToken,
  hashPassword,
};
