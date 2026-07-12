const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendCreated } = require('../utils/apiResponse');
const auditService = require('../services/audit.service');
const notificationService = require('../services/notification.service');

// ─── Audit Controller ─────────────────────────────────────────────────────────

/**
 * POST /api/v1/audit-cycles
 * Body: { name, scopeDepartmentId?, scopeLocation?, startDate, endDate, auditorIds? }
 */
const createCycle = asyncHandler(async (req, res) => {
  const { name, scopeDepartmentId, scopeLocation, startDate, endDate, auditorIds } = req.body;
  const cycle = await auditService.createCycle({
    name,
    scopeDepartmentId,
    scopeLocation,
    startDate,
    endDate,
    auditorIds,
    createdById: req.user.userId,
  });
  return sendCreated(res, cycle, 'Audit cycle created successfully');
});

/**
 * GET /api/v1/audit-cycles
 * Returns a list of all audit cycles (summary).
 */
const listCycles = asyncHandler(async (req, res) => {
  const cycles = await auditService.listCycles();
  return sendSuccess(res, { data: cycles });
});

/**
 * GET /api/v1/audit-cycles/:id
 * Returns the full cycle with items and progress.
 */
const getCycleById = asyncHandler(async (req, res) => {
  const cycle = await auditService.getCycleById(req.params.id);
  return sendSuccess(res, { data: cycle });
});

/**
 * PUT /api/v1/audit-items/:id
 * Body: { result?, notes? }
 * Updates an individual audit item's verification result.
 */
const updateAuditItem = asyncHandler(async (req, res) => {
  const { result, notes } = req.body;
  const item = await auditService.updateAuditItem(req.params.id, { result, notes });
  return sendSuccess(res, { data: item, message: 'Audit item updated' });
});

/**
 * GET /api/v1/audit-cycles/:id/discrepancy-report
 * Returns only non-verified items for this cycle.
 */
const getDiscrepancyReport = asyncHandler(async (req, res) => {
  const report = await auditService.getDiscrepancyReport(req.params.id);
  return sendSuccess(res, { data: report });
});

/**
 * PUT /api/v1/audit-cycles/:id/close
 * Closes the cycle; marks any unresolved items as MISSING.
 */
const closeCycle = asyncHandler(async (req, res) => {
  const cycle = await auditService.closeCycle(req.params.id, req.user.userId);

  // Notify the cycle creator if there are any discrepancies
  const discrepancyCount = cycle.items?.filter(
    (i) => i.result === 'MISSING' || i.result === 'DAMAGED',
  ).length ?? 0;

  notificationService.notifyAuditDiscrepancy({
    createdById:      cycle.createdById,
    cycleName:        cycle.name,
    discrepancyCount,
  });

  return sendSuccess(res, { data: cycle, message: 'Audit cycle closed successfully' });
});

module.exports = {
  createCycle,
  listCycles,
  getCycleById,
  updateAuditItem,
  getDiscrepancyReport,
  closeCycle,
};
