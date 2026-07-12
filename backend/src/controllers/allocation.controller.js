const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendCreated } = require('../utils/apiResponse');
const allocationService = require('../services/allocation.service');
const { logActivity } = require('../services/activityLog.service');
const notificationService = require('../services/notification.service');

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
  });

  // ── Side effects (best-effort) ────────────────────────────────────────────
  logActivity({
    userId:     req.user.userId,
    action:     'ASSET_ALLOCATED',
    entityType: 'Allocation',
    entityId:   allocation.id,
    metadata:   { assetId, allocatedToUserId, allocatedToDepartmentId },
  });
  if (allocatedToUserId) {
    notificationService.notifyAssetAllocated({
      toUserId:  allocatedToUserId,
      assetTag:  allocation.asset?.assetTag,
      assetName: allocation.asset?.name,
    });
  }

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
  });
  return sendSuccess(res, { data: allocations });
});

/**
 * GET /api/v1/allocations/:id
 * Roles: ASSET_MANAGER, ADMIN, DEPARTMENT_HEAD, EMPLOYEE
 */
const getAllocationById = asyncHandler(async (req, res) => {
  const allocation = await allocationService.getAllocationById(req.params.id);
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
  });

  logActivity({
    userId:     req.user.userId,
    action:     'ASSET_RETURNED',
    entityType: 'Allocation',
    entityId:   allocation.id,
    metadata:   { assetId: allocation.assetId, conditionNoteOnReturn },
  });
  if (allocation.allocatedToUser?.id) {
    notificationService.notifyAssetReturned({
      toUserId:  allocation.allocatedToUser.id,
      assetTag:  allocation.asset?.assetTag,
      assetName: allocation.asset?.name,
    });
  }

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
  });

  logActivity({
    userId:     req.user.userId,
    action:     'TRANSFER_REQUESTED',
    entityType: 'Transfer',
    entityId:   transfer.id,
    metadata:   { assetId, fromUserId, toUserId, reason },
  });
  if (fromUserId) {
    notificationService.notifyTransferRequested({
      toUserId:  fromUserId,
      assetTag:  transfer.asset?.assetTag,
      reason,
    });
  }

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
  });
  return sendSuccess(res, { data: transfers });
});

/**
 * GET /api/v1/transfers/:id
 * Roles: ASSET_MANAGER, ADMIN, DEPARTMENT_HEAD
 */
const getTransferById = asyncHandler(async (req, res) => {
  const transfer = await allocationService.getTransferById(req.params.id);
  return sendSuccess(res, { data: transfer });
});

/**
 * PUT /api/v1/transfers/:id/approve
 * Roles: ASSET_MANAGER, ADMIN, DEPARTMENT_HEAD
 */
const approveTransfer = asyncHandler(async (req, res) => {
  const result = await allocationService.approveTransfer(req.params.id, req.user.userId);

  logActivity({
    userId:     req.user.userId,
    action:     'TRANSFER_APPROVED',
    entityType: 'Transfer',
    entityId:   result.transfer?.id,
    metadata:   { assetId: result.transfer?.assetId },
  });
  notificationService.notifyTransferApproved({
    fromUserId: result.transfer?.fromUserId,
    toUserId:   result.transfer?.toUserId,
    assetTag:   result.transfer?.asset?.assetTag,
  });

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
  const transfer = await allocationService.rejectTransfer(req.params.id, req.user.userId);

  logActivity({
    userId:     req.user.userId,
    action:     'TRANSFER_REJECTED',
    entityType: 'Transfer',
    entityId:   transfer.id,
    metadata:   { assetId: transfer.assetId },
  });
  notificationService.notifyTransferRejected({
    requestedById: transfer.requestedById,
    assetTag:      transfer.asset?.assetTag,
  });

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
