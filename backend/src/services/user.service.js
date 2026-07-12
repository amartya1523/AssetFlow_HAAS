const crypto = require('crypto');

const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const {
  ALL_ACTIONS,
  getUserPermissionMap,
} = require('../utils/permissions');
const { hashPassword } = require('./auth.service');
const { logActivity } = require('./activityLog.service');

const TENANT_ROLES = ['EMPLOYEE', 'DEPARTMENT_HEAD', 'ASSET_MANAGER', 'ADMIN'];

const USER_SELECT = {
  id: true,
  organizationId: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  status: true,
  avatarUrl: true,
  departmentId: true,
  department: { select: { id: true, name: true, code: true } },
  createdAt: true,
  updatedAt: true,
};

function assertTenantRole(role) {
  if (!TENANT_ROLES.includes(role)) {
    throw ApiError.badRequest('Invalid tenant role');
  }
}

async function assertDepartment(organizationId, departmentId) {
  if (!departmentId) return;
  const department = await prisma.department.findFirst({
    where: { id: departmentId, organizationId },
    select: { id: true },
  });
  if (!department) throw ApiError.badRequest('Referenced department does not exist');
}

async function listUsers(organizationId, { role, status, departmentId, search } = {}) {
  const where = { organizationId };
  if (role) where.role = role;
  if (status) where.status = status;
  if (departmentId) where.departmentId = departmentId;
  if (search) {
    const term = search.trim();
    where.OR = [
      { name: { contains: term, mode: 'insensitive' } },
      { email: { contains: term, mode: 'insensitive' } },
    ];
  }

  return prisma.user.findMany({
    where,
    select: USER_SELECT,
    orderBy: [{ name: 'asc' }],
  });
}

async function createUser(organizationId, payload, actorId = null) {
  const name = payload.name?.trim();
  const email = payload.email?.trim().toLowerCase();
  const role = payload.role || 'EMPLOYEE';

  if (!name) throw ApiError.badRequest('Name is required');
  if (!email) throw ApiError.badRequest('Email is required');
  assertTenantRole(role);
  await assertDepartment(organizationId, payload.departmentId);

  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    throw ApiError.conflict('Email already registered');
  }

  const temporaryPassword = payload.password || crypto.randomBytes(9).toString('base64url');
  const passwordHash = await hashPassword(temporaryPassword);

  const user = await prisma.user.create({
    data: {
      organizationId,
      name,
      email,
      phone: payload.phone || null,
      departmentId: payload.departmentId || null,
      passwordHash,
      role,
      status: payload.status || 'ACTIVE',
    },
    select: USER_SELECT,
  });

  await logActivity({
    organizationId,
    userId: actorId,
    action: 'USER_CREATED',
    entityType: 'User',
    entityId: user.id,
    metadata: { email: user.email, role: user.role },
  });

  // Console stub until email invitations exist.
  // eslint-disable-next-line no-console
  console.log(`[USER_INVITE] Temporary password for ${email}: ${temporaryPassword}`);

  return { user, temporaryPassword };
}

async function updateUser(organizationId, id, payload, actorId = null) {
  const existing = await prisma.user.findFirst({ where: { id, organizationId }, select: USER_SELECT });
  if (!existing) throw ApiError.notFound('User not found');

  const data = {};
  if (payload.name !== undefined) {
    const name = payload.name.trim();
    if (!name) throw ApiError.badRequest('Name cannot be empty');
    data.name = name;
  }
  if (payload.phone !== undefined) data.phone = payload.phone || null;
  if (payload.role !== undefined) {
    assertTenantRole(payload.role);
    data.role = payload.role;
  }
  if (payload.status !== undefined) data.status = payload.status;
  if (payload.departmentId !== undefined) {
    await assertDepartment(organizationId, payload.departmentId);
    data.departmentId = payload.departmentId || null;
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: USER_SELECT,
  });

  await logActivity({
    organizationId,
    userId: actorId,
    action: 'USER_UPDATED',
    entityType: 'User',
    entityId: id,
    metadata: { before: existing, after: updated },
  });

  return updated;
}

async function getPermissions(organizationId, id) {
  const user = await prisma.user.findFirst({
    where: { id, organizationId },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!user) throw ApiError.notFound('User not found');

  const permissions = await getUserPermissionMap(user.id, user.role);
  return { user, actions: ALL_ACTIONS, ...permissions };
}

async function replacePermissionOverrides(organizationId, id, overrides = [], actorId = null) {
  const user = await prisma.user.findFirst({
    where: { id, organizationId },
    select: { id: true, role: true },
  });
  if (!user) throw ApiError.notFound('User not found');

  const normalized = overrides.map((override) => {
    if (!ALL_ACTIONS.includes(override.permissionKey)) {
      throw ApiError.badRequest(`Unknown permission: ${override.permissionKey}`);
    }
    if (!['GRANT', 'REVOKE'].includes(override.effect)) {
      throw ApiError.badRequest('Permission effect must be GRANT or REVOKE');
    }
    return {
      userId: id,
      permissionKey: override.permissionKey,
      effect: override.effect,
      grantedById: actorId,
    };
  });

  await prisma.$transaction([
    prisma.userPermissionOverride.deleteMany({ where: { userId: id } }),
    ...(normalized.length
      ? [prisma.userPermissionOverride.createMany({ data: normalized })]
      : []),
  ]);

  await logActivity({
    organizationId,
    userId: actorId,
    action: 'USER_PERMISSIONS_UPDATED',
    entityType: 'User',
    entityId: id,
    metadata: { overrides: normalized },
  });

  return getPermissions(organizationId, id);
}

module.exports = {
  TENANT_ROLES,
  listUsers,
  createUser,
  updateUser,
  getPermissions,
  replacePermissionOverrides,
};
