const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const dashboardService = require('../services/dashboard.service');

const getOverview = asyncHandler(async (req, res) => {
  const data = await dashboardService.getOverview(req.tenant.organizationId, req.query);
  return sendSuccess(res, { data });
});

const getKPIs = asyncHandler(async (req, res) => {
  const data = await dashboardService.getDashboardKPIs(req.tenant.organizationId);
  return sendSuccess(res, { data });
});

const getRecentActivity = asyncHandler(async (req, res) => {
  const { limit } = req.query;
  const data = await dashboardService.getRecentActivity({
    organizationId: req.tenant.organizationId,
    limit,
  });
  return sendSuccess(res, { data });
});

module.exports = {
  getOverview,
  getKPIs,
  getRecentActivity,
};
