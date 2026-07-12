const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const { logActivity } = require('./activityLog.service');

// ─── Departments ────────────────────────────────────────────────────────────

const DEPARTMENT_SELECT = {
  id: true,
  organizationId: true,
  name: true,
  code: true,
  headId: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  head: { select: { id: true, name: true, email: true } },
  parentDepartmentId: true,
  parentDepartment: { select: { id: true, name: true } },
};

/**
 * List all departments. Single source of truth for the frontend department
 * pickers used across later modules.
 */
async function listDepartments(organizationId) {
  return prisma.department.findMany({
    where: { organizationId },
    select: DEPARTMENT_SELECT,
    orderBy: [{ name: 'asc' }],
  });
}

/**
 * Create a department.
 */
async function createDepartment(organizationId, { name, code, headId, parentDepartmentId, status }, actorId = null) {
  const trimmedName = name?.trim();
  const trimmedCode = code?.trim();

  if (!trimmedName) throw ApiError.badRequest('Department name is required');
  if (!trimmedCode) throw ApiError.badRequest('Department code is required');

  // Validate referenced rows up front so the error is informative.
  if (headId && !(await prisma.user.findFirst({ where: { id: headId, organizationId } }))) {
    throw ApiError.badRequest('Referenced head user does not exist');
  }
  if (parentDepartmentId && !(await prisma.department.findFirst({ where: { id: parentDepartmentId, organizationId } }))) {
    throw ApiError.badRequest('Referenced parent department does not exist');
  }

  try {
    const department = await prisma.department.create({
      data: {
        organizationId,
        name: trimmedName,
        code: trimmedCode,
        headId: headId || null,
        parentDepartmentId: parentDepartmentId || null,
        status: status || 'ACTIVE',
      },
      select: DEPARTMENT_SELECT,
    });

    await logActivity({
      organizationId,
      userId: actorId,
      action: 'DEPARTMENT_CREATED',
      entityType: 'Department',
      entityId: department.id,
      metadata: { name: department.name, code: department.code },
    });

    return department;
  } catch (err) {
    // Unique violation on code / (name,code) — let the central handler map P2002.
    throw err;
  }
}

/**
 * Update a department. All fields optional.
 */
async function updateDepartment(organizationId, id, patch, actorId = null) {
  const existing = await prisma.department.findFirst({ where: { id, organizationId } });
  if (!existing) throw ApiError.notFound('Department not found');

  if (patch.headId && !(await prisma.user.findFirst({ where: { id: patch.headId, organizationId } }))) {
    throw ApiError.badRequest('Referenced head user does not exist');
  }
  if (
    patch.parentDepartmentId &&
    patch.parentDepartmentId === id
  ) {
    throw ApiError.badRequest('A department cannot be its own parent');
  }
  if (patch.parentDepartmentId && !(await prisma.department.findFirst({ where: { id: patch.parentDepartmentId, organizationId } }))) {
    throw ApiError.badRequest('Referenced parent department does not exist');
  }

  const data = {};
  if (patch.name !== undefined) data.name = patch.name.trim();
  if (patch.code !== undefined) data.code = patch.code.trim();
  if (patch.headId !== undefined) data.headId = patch.headId || null;
  if (patch.parentDepartmentId !== undefined) data.parentDepartmentId = patch.parentDepartmentId || null;
  if (patch.status !== undefined) data.status = patch.status;

  const updated = await prisma.department.update({
    where: { id },
    data,
    select: DEPARTMENT_SELECT,
  });

  await logActivity({
    organizationId,
    userId: actorId,
    action: 'DEPARTMENT_UPDATED',
    entityType: 'Department',
    entityId: id,
    metadata: { before: existing, after: updated },
  });

  return updated;
}

/**
 * Soft-delete a department (status -> INACTIVE) per the "prefer soft status
 * changes over destructive deletes" database standard.
 */
async function deleteDepartment(organizationId, id, actorId = null) {
  const existing = await prisma.department.findFirst({ where: { id, organizationId } });
  if (!existing) throw ApiError.notFound('Department not found');

  const updated = await prisma.department.update({
    where: { id },
    data: { status: 'INACTIVE' },
    select: DEPARTMENT_SELECT,
  });

  await logActivity({
    organizationId,
    userId: actorId,
    action: 'DEPARTMENT_DEACTIVATED',
    entityType: 'Department',
    entityId: id,
    metadata: { name: existing.name, code: existing.code },
  });

  return updated;
}

// ─── Asset categories ───────────────────────────────────────────────────────

const CATEGORY_SELECT = {
  id: true,
  organizationId: true,
  name: true,
  extraFieldsSchema: true,
  status: true,
  createdAt: true,
  updatedAt: true,
};

async function listCategories(organizationId) {
  return prisma.assetCategory.findMany({
    where: { organizationId },
    select: CATEGORY_SELECT,
    orderBy: [{ name: 'asc' }],
  });
}

async function createCategory(organizationId, { name, extraFieldsSchema, status }) {
  const trimmedName = name?.trim();
  if (!trimmedName) throw ApiError.badRequest('Category name is required');

  return prisma.assetCategory.create({
    data: {
      organizationId,
      name: trimmedName,
      extraFieldsSchema: extraFieldsSchema ?? undefined,
      status: status || 'ACTIVE',
    },
    select: CATEGORY_SELECT,
  });
}

async function updateCategory(organizationId, id, patch) {
  const existing = await prisma.assetCategory.findFirst({ where: { id, organizationId } });
  if (!existing) throw ApiError.notFound('Category not found');

  const data = {};
  if (patch.name !== undefined) data.name = patch.name.trim();
  if (patch.extraFieldsSchema !== undefined) data.extraFieldsSchema = patch.extraFieldsSchema;
  if (patch.status !== undefined) data.status = patch.status;

  return prisma.assetCategory.update({
    where: { id },
    data,
    select: CATEGORY_SELECT,
  });
}

async function deleteCategory(organizationId, id) {
  const existing = await prisma.assetCategory.findFirst({ where: { id, organizationId } });
  if (!existing) throw ApiError.notFound('Category not found');

  return prisma.assetCategory.update({
    where: { id },
    data: { status: 'INACTIVE' },
    select: CATEGORY_SELECT,
  });
}

// ─── Employees ──────────────────────────────────────────────────────────────

const EMPLOYEE_SELECT = {
  id: true,
  organizationId: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  status: true,
  avatarUrl: true,
  departmentId: true,
  department: { select: { id: true, name: true } },
  createdAt: true,
};

/**
 * List employees (users). Supports optional filtering by role and departmentId
 * for later pickers, but the directory endpoint is read-only for admins.
 */
async function listEmployees(organizationId, { role, status, departmentId } = {}) {
  const where = { organizationId };
  if (role) where.role = role;
  if (status) where.status = status;
  if (departmentId) where.departmentId = departmentId;

  return prisma.user.findMany({
    where,
    select: EMPLOYEE_SELECT,
    orderBy: [{ name: 'asc' }],
  });
}

/**
 * Update a user's role. This is the ONLY place in the system where a user's
 * role can change — enforcing the non-self-elevation rule from Task 4 at the
 * system level (the route is admin-only).
 */
async function updateUserRole(organizationId, id, role, actorId = null) {
  const existing = await prisma.user.findFirst({ where: { id, organizationId } });
  if (!existing) throw ApiError.notFound('Employee not found');
  if (role === 'SUPER_ADMIN') throw ApiError.badRequest('SUPER_ADMIN is a platform role');

  if (existing.role === role) {
    // No-op; return current state without logging noise.
    return prisma.user.findUnique({ where: { id }, select: EMPLOYEE_SELECT });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { role },
    select: EMPLOYEE_SELECT,
  });

  await logActivity({
    organizationId,
    userId: actorId,
    action: 'EMPLOYEE_ROLE_CHANGED',
    entityType: 'User',
    entityId: id,
    metadata: { from: existing.role, to: role },
  });

  return updated;
}

module.exports = {
  listDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listEmployees,
  updateUserRole,
};
