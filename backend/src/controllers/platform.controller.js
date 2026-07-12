const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const platformService = require('../services/platform.service');

const listOrganizations = asyncHandler(async (req, res) => {
  const data = await platformService.listOrganizations(req.query);
  return sendSuccess(res, { data });
});

const getOrganization = asyncHandler(async (req, res) => {
  const data = await platformService.getOrganization(req.params.id);
  return sendSuccess(res, { data });
});

const updateOrganizationStatus = asyncHandler(async (req, res) => {
  const data = await platformService.updateOrganizationStatus(req.params.id, req.body.status, req.user.userId);
  return sendSuccess(res, { data, message: 'Organization status updated' });
});

const listOrganizationAssets = asyncHandler(async (req, res) => {
  const data = await platformService.listOrganizationAssets(req.params.id, req.query);
  return sendSuccess(res, { data });
});

module.exports = {
  listOrganizations,
  getOrganization,
  updateOrganizationStatus,
  listOrganizationAssets,
};
