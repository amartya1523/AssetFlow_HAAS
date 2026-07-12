const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendCreated } = require('../utils/apiResponse');
const userService = require('../services/user.service');

const listUsers = asyncHandler(async (req, res) => {
  const data = await userService.listUsers(req.tenant.organizationId, req.query);
  return sendSuccess(res, { data });
});

const createUser = asyncHandler(async (req, res) => {
  const data = await userService.createUser(req.tenant.organizationId, req.body, req.user.userId);
  return sendCreated(res, data, 'User created');
});

const updateUser = asyncHandler(async (req, res) => {
  const data = await userService.updateUser(req.tenant.organizationId, req.params.id, req.body, req.user.userId);
  return sendSuccess(res, { data, message: 'User updated' });
});

const getPermissions = asyncHandler(async (req, res) => {
  const data = await userService.getPermissions(req.tenant.organizationId, req.params.id);
  return sendSuccess(res, { data });
});

const updatePermissions = asyncHandler(async (req, res) => {
  const data = await userService.replacePermissionOverrides(
    req.tenant.organizationId,
    req.params.id,
    req.body.overrides || [],
    req.user.userId,
  );
  return sendSuccess(res, { data, message: 'Permissions updated' });
});

module.exports = {
  listUsers,
  createUser,
  updateUser,
  getPermissions,
  updatePermissions,
};
