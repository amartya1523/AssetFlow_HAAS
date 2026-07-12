const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendCreated } = require('../utils/apiResponse');
const orgService = require('../services/organization.service');

// ─── Departments ────────────────────────────────────────────────────────────

const listDepartments = asyncHandler(async (req, res) => {
  const data = await orgService.listDepartments();
  return sendSuccess(res, { data });
});

const createDepartment = asyncHandler(async (req, res) => {
  const data = await orgService.createDepartment(req.body, req.user?.userId);
  return sendCreated(res, data, 'Department created');
});

const updateDepartment = asyncHandler(async (req, res) => {
  const data = await orgService.updateDepartment(req.params.id, req.body, req.user?.userId);
  return sendSuccess(res, { data });
});

const deleteDepartment = asyncHandler(async (req, res) => {
  const data = await orgService.deleteDepartment(req.params.id, req.user?.userId);
  return sendSuccess(res, { data });
});

// ─── Categories ─────────────────────────────────────────────────────────────

const listCategories = asyncHandler(async (req, res) => {
  const data = await orgService.listCategories();
  return sendSuccess(res, { data });
});

const createCategory = asyncHandler(async (req, res) => {
  const data = await orgService.createCategory(req.body);
  return sendCreated(res, data, 'Category created');
});

const updateCategory = asyncHandler(async (req, res) => {
  const data = await orgService.updateCategory(req.params.id, req.body);
  return sendSuccess(res, { data });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const data = await orgService.deleteCategory(req.params.id);
  return sendSuccess(res, { data });
});

// ─── Employees ──────────────────────────────────────────────────────────────

const listEmployees = asyncHandler(async (req, res) => {
  const data = await orgService.listEmployees(req.query);
  return sendSuccess(res, { data });
});

const updateEmployeeRole = asyncHandler(async (req, res) => {
  const data = await orgService.updateUserRole(req.params.id, req.body.role, req.user?.userId);
  return sendSuccess(res, { data });
});

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
  updateEmployeeRole,
};
