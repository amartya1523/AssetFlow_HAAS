const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const reportsService = require('../services/reports.service');

const getSummary = asyncHandler(async (req, res) => {
  const data = await reportsService.getSummary(req.tenant.organizationId);
  return sendSuccess(res, { data });
});

const exportReport = asyncHandler(async (req, res) => {
  const csv = await reportsService.exportSummary(req.tenant.organizationId);
  const dateStamp = new Date().toISOString().split('T')[0];

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="assetflow-report-${dateStamp}.csv"`);
  return res.status(200).send(csv);
});

module.exports = {
  getSummary,
  exportReport,
};
