const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const dashboardService = require('../services/dashboard.service');

const getOverview = asyncHandler(async (req, res) => {
  const data = await dashboardService.getOverview(req.tenant.organizationId, req.query);
  return sendSuccess(res, { data });
});

module.exports = { getOverview };
