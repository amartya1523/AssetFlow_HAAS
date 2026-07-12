const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const { logActivity } = require('./activityLog.service');

// ─── Departments ────────────────────────────────────────────────────────────

const DEPARTMENT_SELECT = {
  id: true,
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
async function listDepartments() {
  return prisma.department.findMany({
    select: DEPARTMENT_SELECT,
    orderBy: [{ name: 'asc' }],
  });
}

/**
 * Create a department.
 */
async function createDepartment({ name, code, headId, parentDepartmentId, status }, actorId = null) {
  const trimmedName = name?.trim();
  const trimmedCode = code?.trim();

  if (!trimmedName) throw ApiError.badRequest('Department name is required');
  if (!trimmedCode) throw ApiError.badRequest('Department code is required');

  // Validate referenced rows up front so the error is informative.
  if (headId && !(await prisma.user.findUnique({ where: { id: headId } }))) {
    throw ApiError.badRequest('Referenced head user does not exist');
  }
  if (parentDepartmentId && !(await prisma.department.findUnique({ where: { id: parentDepartmentId } }))) {
    throw ApiError.badRequest('Referenced parent department does not exist');
  }

  try {
    const department = await prisma.department.create({
      data: {
        name: trimmedName,
        code: trimmedCode,
        headId: headId || null,
        parentDepartmentId: parentDepartmentId || null,
        status: status || 'ACTIVE',
      },
      select: DEPARTMENT_SELECT,
    });

    await logActivity({
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
async function updateDepartment(id, patch, actorId = null) {
  const existing = await prisma.department.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Department not found');

  if (patch.headId && !(await prisma.user.findUnique({ where: { id: patch.headId } }))) {
    throw ApiError.badRequest('Referenced head user does not exist');
  }
  if (
    patch.parentDepartmentId &&
    patch.parentDepartmentId === id
  ) {
    throw ApiError.badRequest('A department cannot be its own parent');
  }
  if (patch.parentDepartmentId && !(await prisma.department.findUnique({ where: { id: patch.parentDepartmentId } }))) {
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
async function deleteDepartment(id, actorId = null) {
  const existing = await prisma.department.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Department not found');

  const updated = await prisma.department.update({
    where: { id },
    data: { status: 'INACTIVE' },
    select: DEPARTMENT_SELECT,
  });

  await logActivity({
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
  name: true,
  extraFieldsSchema: true,
  status: true,
  createdAt: true,
  updatedAt: true,
};

async function listCategories() {
  return prisma.assetCategory.findMany({
    select: CATEGORY_SELECT,
    orderBy: [{ name: 'asc' }],
  });
}

async function createCategory({ name, extraFieldsSchema, status }) {
  const trimmedName = name?.trim();
  if (!trimmedName) throw ApiError.badRequest('Category name is required');

  return prisma.assetCategory.create({
    data: {
      name: trimmedName,
      extraFieldsSchema: extraFieldsSchema ?? undefined,
      status: status || 'ACTIVE',
    },
    select: CATEGORY_SELECT,
  });
}

async function updateCategory(id, patch) {
  const existing = await prisma.assetCategory.findUnique({ where: { id } });
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

async function deleteCategory(id) {
  const existing = await prisma.assetCategory.findUnique({ where: { id } });
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
async function listEmployees({ role, departmentId } = {}) {
  const where = {};
  if (role) where.role = role;
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
async function updateUserRole(id, role, actorId = null) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Employee not found');

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
