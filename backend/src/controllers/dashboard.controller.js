const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const dashboardService = require('../services/dashboard.service');

const getOverview = asyncHandler(async (req, res) => {
  const data = await dashboardService.getOverview(req.tenant.organizationId, req.query);
  return sendSuccess(res, { data });
});


/**
 * GET /api/v1/dashboard/kpis
 * Returns all KPIs needed for the dashboard in one call.
 */
const getKPIs = asyncHandler(async (req, res) => {
  const kpis = await dashboardService.getDashboardKPIs();
  return sendSuccess(res, { data: kpis });
});

/**
 * GET /api/v1/dashboard/recent-activity
 * Query: limit? (default 20, max 100)
 */
const getRecentActivity = asyncHandler(async (req, res) => {
  const { limit } = req.query;
  const activity = await dashboardService.getRecentActivity({ limit });
  return sendSuccess(res, { data: activity });
});

module.exports = {
  getOverview,
  getKPIs,
  getRecentActivity,
};
