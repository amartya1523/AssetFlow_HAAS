const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendCreated } = require('../utils/apiResponse');
const allocationService = require('../services/allocation.service');

// ─── Allocations ─────────────────────────────────────────────────────────────

/**
 * POST /api/v1/allocations
 * Roles: ASSET_MANAGER, ADMIN
 */
const createAllocation = asyncHandler(async (req, res) => {
  const { assetId, allocatedToUserId, allocatedToDepartmentId, expectedReturnDate } = req.body;
  const allocation = await allocationService.createAllocation({
    assetId,
    allocatedToUserId,
    allocatedToDepartmentId,
    expectedReturnDate,
  }, req.user);
  return sendCreated(res, allocation);
});

/**
 * GET /api/v1/allocations
 * Query: assetId?, allocatedToUserId?, status?
 * Roles: ASSET_MANAGER, ADMIN, DEPARTMENT_HEAD
 */
const listAllocations = asyncHandler(async (req, res) => {
  const { assetId, allocatedToUserId, status } = req.query;
  const allocations = await allocationService.listAllocations({
    assetId,
    allocatedToUserId,
    status,
  }, req.user);
  return sendSuccess(res, { data: allocations });
});

/**
 * GET /api/v1/allocations/:id
 * Roles: ASSET_MANAGER, ADMIN, DEPARTMENT_HEAD, EMPLOYEE
 */
const getAllocationById = asyncHandler(async (req, res) => {
  const allocation = await allocationService.getAllocationById(req.params.id, req.user);
  return sendSuccess(res, { data: allocation });
});

/**
 * PUT /api/v1/allocations/:id/return
 * Body: { conditionNoteOnReturn? }
 * Roles: ASSET_MANAGER, ADMIN, DEPARTMENT_HEAD
 */
const returnAllocation = asyncHandler(async (req, res) => {
  const { conditionNoteOnReturn } = req.body;
  const allocation = await allocationService.returnAllocation(req.params.id, {
    conditionNoteOnReturn,
  }, req.user);
  return sendSuccess(res, { data: allocation, message: 'Asset returned successfully' });
});

// ─── Transfers ───────────────────────────────────────────────────────────────

/**
 * POST /api/v1/transfers
 * Body: { assetId, fromUserId?, toUserId, reason }
 * Roles: all authenticated
 */
const createTransfer = asyncHandler(async (req, res) => {
  const { assetId, fromUserId, toUserId, reason } = req.body;
  const transfer = await allocationService.createTransfer({
    assetId,
    fromUserId,
    toUserId,
    reason,
    requestedById: req.user.userId,
  }, req.user);
  return sendCreated(res, transfer);
});

/**
 * GET /api/v1/transfers
 * Query: assetId?, fromUserId?, toUserId?, status?
 * Roles: ASSET_MANAGER, ADMIN, DEPARTMENT_HEAD
 */
const listTransfers = asyncHandler(async (req, res) => {
  const { assetId, fromUserId, toUserId, status } = req.query;
  const transfers = await allocationService.listTransfers({
    assetId,
    fromUserId,
    toUserId,
    status,
  }, req.user);
  return sendSuccess(res, { data: transfers });
});

/**
 * GET /api/v1/transfers/:id
 * Roles: ASSET_MANAGER, ADMIN, DEPARTMENT_HEAD
 */
const getTransferById = asyncHandler(async (req, res) => {
  const transfer = await allocationService.getTransferById(req.params.id, req.user);
  return sendSuccess(res, { data: transfer });
});

/**
 * PUT /api/v1/transfers/:id/approve
 * Roles: ASSET_MANAGER, ADMIN, DEPARTMENT_HEAD
 */
const approveTransfer = asyncHandler(async (req, res) => {
  const result = await allocationService.approveTransfer(req.params.id, req.user.userId, req.user);
  return sendSuccess(res, {
    data: result,
    message: 'Transfer approved and asset re-allocated',
  });
});

/**
 * PUT /api/v1/transfers/:id/reject
 * Roles: ASSET_MANAGER, ADMIN, DEPARTMENT_HEAD
 */
const rejectTransfer = asyncHandler(async (req, res) => {
  const transfer = await allocationService.rejectTransfer(req.params.id, req.user.userId, req.user);
  return sendSuccess(res, { data: transfer, message: 'Transfer request rejected' });
});

module.exports = {
  createAllocation,
  listAllocations,
  getAllocationById,
  returnAllocation,
  createTransfer,
  listTransfers,
  getTransferById,
  approveTransfer,
  rejectTransfer,
};
