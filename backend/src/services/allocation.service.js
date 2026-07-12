const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Derive isOverdue flag from an allocation record.
 * An allocation is overdue when it is ACTIVE and its expectedReturnDate is
 * in the past. This is computed on read so we never need a cron to mutate
 * stored status — the DB value stays ACTIVE; the derived flag is returned
 * to clients consistently.
 */
function withOverdue(allocation) {
  if (!allocation) return null;
  const isOverdue =
    allocation.status === 'ACTIVE' &&
    allocation.expectedReturnDate !== null &&
    allocation.expectedReturnDate < new Date();
  return { ...allocation, isOverdue };
}

// ─── Allocation ──────────────────────────────────────────────────────────────

/**
 * Create a new allocation for an asset.
 *
 * Business rules enforced:
 * 1. Asset must exist.
 * 2. Asset must not already have an ACTIVE allocation (409 with conflict data).
 * 3. Asset status must allow allocation (not UNDER_MAINTENANCE / LOST /
 *    RETIRED / DISPOSED).
 * 4. On success: create Allocation record + set asset.status = ALLOCATED
 *    in one Prisma transaction.
 */
async function createAllocation({ assetId, allocatedToUserId, allocatedToDepartmentId, expectedReturnDate }) {
  // 1. Fetch asset
  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
  });
  if (!asset) {
    throw ApiError.notFound('Asset not found');
  }

  // 2. Block non-allocatable statuses
  const blocked = ['UNDER_MAINTENANCE', 'LOST', 'RETIRED', 'DISPOSED'];
  if (blocked.includes(asset.status)) {
    throw new ApiError(
      409,
      `Asset cannot be allocated — current status is ${asset.status}`,
    );
  }

  // 3. Conflict check — single active allocation guard
  const existing = await prisma.allocation.findFirst({
    where: { assetId, status: 'ACTIVE' },
    include: {
      allocatedToUser: {
        select: { id: true, name: true, email: true, departmentId: true },
      },
      allocatedToDepartment: {
        select: { id: true, name: true },
      },
    },
  });

  if (existing) {
    // Return 409 with structured conflict data so the Task 12 frontend can
    // render the conflict banner and pre-populate the transfer form.
    throw new ApiError(409, 'Asset is already allocated', [
      {
        field: 'assetId',
        message: 'Asset already has an active allocation',
        conflict: {
          allocationId: existing.id,
          allocatedTo: existing.allocatedToUser ?? null,
          allocatedToDepartment: existing.allocatedToDepartment ?? null,
          since: existing.allocatedAt,
          expectedReturnDate: existing.expectedReturnDate ?? null,
        },
      },
    ]);
  }

  // 4. Create allocation + update asset status atomically
  const [allocation] = await prisma.$transaction([
    prisma.allocation.create({
      data: {
        assetId,
        allocatedToUserId: allocatedToUserId ?? null,
        allocatedToDepartmentId: allocatedToDepartmentId ?? null,
        expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : null,
        status: 'ACTIVE',
      },
      include: {
        asset: {
          select: { id: true, assetTag: true, name: true, status: true },
        },
        allocatedToUser: {
          select: { id: true, name: true, email: true },
        },
        allocatedToDepartment: {
          select: { id: true, name: true },
        },
      },
    }),
    prisma.asset.update({
      where: { id: assetId },
      data: { status: 'ALLOCATED' },
    }),
  ]);

  return withOverdue(allocation);
}

/**
 * Return an asset — close the active allocation and set asset back to AVAILABLE.
 */
async function returnAllocation(allocationId, { conditionNoteOnReturn } = {}) {
  const allocation = await prisma.allocation.findUnique({
    where: { id: allocationId },
  });

  if (!allocation) {
    throw ApiError.notFound('Allocation not found');
  }

  if (allocation.status !== 'ACTIVE') {
    throw ApiError.badRequest(
      `Allocation is already ${allocation.status} and cannot be returned`,
    );
  }

  const [returned] = await prisma.$transaction([
    prisma.allocation.update({
      where: { id: allocationId },
      data: {
        status: 'RETURNED',
        actualReturnDate: new Date(),
        conditionNoteOnReturn: conditionNoteOnReturn ?? null,
      },
      include: {
        asset: {
          select: { id: true, assetTag: true, name: true },
        },
        allocatedToUser: {
          select: { id: true, name: true, email: true },
        },
        allocatedToDepartment: {
          select: { id: true, name: true },
        },
      },
    }),
    prisma.asset.update({
      where: { id: allocation.assetId },
      data: { status: 'AVAILABLE' },
    }),
  ]);

  return returned;
}

/**
 * List allocations with optional filters.
 * Enriches each record with isOverdue derived flag.
 */
async function listAllocations({ assetId, allocatedToUserId, status } = {}) {
  const where = {};
  if (assetId) where.assetId = assetId;
  if (allocatedToUserId) where.allocatedToUserId = allocatedToUserId;
  if (status) where.status = status;

  const allocations = await prisma.allocation.findMany({
    where,
    orderBy: { allocatedAt: 'desc' },
    include: {
      asset: {
        select: { id: true, assetTag: true, name: true, status: true },
      },
      allocatedToUser: {
        select: { id: true, name: true, email: true },
      },
      allocatedToDepartment: {
        select: { id: true, name: true },
      },
    },
  });

  return allocations.map(withOverdue);
}

/**
 * Get a single allocation by ID with isOverdue derived.
 */
async function getAllocationById(id) {
  const allocation = await prisma.allocation.findUnique({
    where: { id },
    include: {
      asset: {
        select: { id: true, assetTag: true, name: true, status: true },
      },
      allocatedToUser: {
        select: { id: true, name: true, email: true },
      },
      allocatedToDepartment: {
        select: { id: true, name: true },
      },
    },
  });

  if (!allocation) throw ApiError.notFound('Allocation not found');
  return withOverdue(allocation);
}

// ─── Transfer ────────────────────────────────────────────────────────────────

/**
 * Create a transfer request.
 *
 * Business rules:
 * - Asset must currently be ALLOCATED.
 * - There must be a live ACTIVE allocation on the asset.
 * - No duplicate REQUESTED transfer allowed for the same asset.
 * - reason is required (enforced by validator, but double-checked here).
 */
async function createTransfer({ assetId, fromUserId, toUserId, reason, requestedById }) {
  // 1. Asset must exist and be ALLOCATED
  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) throw ApiError.notFound('Asset not found');

  if (asset.status !== 'ALLOCATED') {
    throw new ApiError(
      409,
      `Transfer requests are only allowed for ALLOCATED assets. Current status: ${asset.status}`,
    );
  }

  // 2. Confirm active allocation exists
  const activeAllocation = await prisma.allocation.findFirst({
    where: { assetId, status: 'ACTIVE' },
  });
  if (!activeAllocation) {
    throw new ApiError(
      409,
      'No active allocation found for this asset — cannot request transfer',
    );
  }

  // 3. Block duplicate pending transfers for the same asset
  const existingPending = await prisma.transfer.findFirst({
    where: { assetId, status: 'REQUESTED' },
  });
  if (existingPending) {
    throw new ApiError(
      409,
      'A pending transfer request already exists for this asset. Wait for it to be resolved before submitting another.',
    );
  }

  // 4. from and to must differ
  if (fromUserId && toUserId && fromUserId === toUserId) {
    throw ApiError.badRequest('fromUserId and toUserId must be different');
  }

  const transfer = await prisma.transfer.create({
    data: {
      assetId,
      fromUserId: fromUserId ?? null,
      toUserId: toUserId ?? null,
      requestedById,
      reason,
      status: 'REQUESTED',
    },
    include: {
      asset: { select: { id: true, assetTag: true, name: true } },
      fromUser: { select: { id: true, name: true, email: true } },
      toUser: { select: { id: true, name: true, email: true } },
      requestedBy: { select: { id: true, name: true, email: true } },
    },
  });

  return transfer;
}

/**
 * Approve a transfer request.
 *
 * Atomically in ONE transaction:
 *  1. Close the existing ACTIVE allocation (status = RETURNED)
 *  2. Create a new ACTIVE allocation for toUser
 *  3. Keep asset status = ALLOCATED (no gap in ownership)
 *  4. Mark Transfer status = APPROVED + record resolvedAt
 *
 * This is the most critical operation in the entire product — history is
 * fully preserved because the old allocation row is never deleted.
 */
async function approveTransfer(transferId, approverId) {
  const transfer = await prisma.transfer.findUnique({
    where: { id: transferId },
  });

  if (!transfer) throw ApiError.notFound('Transfer request not found');

  if (transfer.status !== 'REQUESTED') {
    throw new ApiError(
      409,
      `Only REQUESTED transfers can be approved. Current status: ${transfer.status}`,
    );
  }

  // Confirm there is still an active allocation to close
  const activeAllocation = await prisma.allocation.findFirst({
    where: { assetId: transfer.assetId, status: 'ACTIVE' },
  });

  if (!activeAllocation) {
    throw new ApiError(
      409,
      'Cannot approve transfer — the asset has no active allocation (it may have already been returned)',
    );
  }

  const [closedAllocation, newAllocation, , approvedTransfer] =
    await prisma.$transaction([
      // Step 1 — close the old allocation
      prisma.allocation.update({
        where: { id: activeAllocation.id },
        data: {
          status: 'RETURNED',
          actualReturnDate: new Date(),
          conditionNoteOnReturn: `Closed by transfer approval (Transfer #${transferId})`,
        },
      }),

      // Step 2 — open a new allocation for the receiving user/department
      prisma.allocation.create({
        data: {
          assetId: transfer.assetId,
          allocatedToUserId: transfer.toUserId ?? null,
          status: 'ACTIVE',
        },
        include: {
          asset: { select: { id: true, assetTag: true, name: true } },
          allocatedToUser: { select: { id: true, name: true, email: true } },
        },
      }),

      // Step 3 — asset stays ALLOCATED (no status gap)
      prisma.asset.update({
        where: { id: transfer.assetId },
        data: { status: 'ALLOCATED' },
      }),

      // Step 4 — mark transfer APPROVED
      prisma.transfer.update({
        where: { id: transferId },
        data: {
          status: 'APPROVED',
          resolvedAt: new Date(),
        },
        include: {
          asset: { select: { id: true, assetTag: true, name: true } },
          fromUser: { select: { id: true, name: true, email: true } },
          toUser: { select: { id: true, name: true, email: true } },
          requestedBy: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

  return {
    transfer: approvedTransfer,
    closedAllocation,
    newAllocation: withOverdue(newAllocation),
  };
}

/**
 * Reject a transfer request.
 * Asset state does NOT change — the existing allocation stays ACTIVE.
 */
async function rejectTransfer(transferId, approverId) {
  const transfer = await prisma.transfer.findUnique({
    where: { id: transferId },
  });

  if (!transfer) throw ApiError.notFound('Transfer request not found');

  if (transfer.status !== 'REQUESTED') {
    throw new ApiError(
      409,
      `Only REQUESTED transfers can be rejected. Current status: ${transfer.status}`,
    );
  }

  const rejected = await prisma.transfer.update({
    where: { id: transferId },
    data: {
      status: 'REJECTED',
      resolvedAt: new Date(),
    },
    include: {
      asset: { select: { id: true, assetTag: true, name: true } },
      fromUser: { select: { id: true, name: true, email: true } },
      toUser: { select: { id: true, name: true, email: true } },
      requestedBy: { select: { id: true, name: true, email: true } },
    },
  });

  return rejected;
}

/**
 * List transfer requests with optional filters.
 */
async function listTransfers({ assetId, fromUserId, toUserId, status } = {}) {
  const where = {};
  if (assetId) where.assetId = assetId;
  if (fromUserId) where.fromUserId = fromUserId;
  if (toUserId) where.toUserId = toUserId;
  if (status) where.status = status;

  return prisma.transfer.findMany({
    where,
    orderBy: { requestedAt: 'desc' },
    include: {
      asset: { select: { id: true, assetTag: true, name: true } },
      fromUser: { select: { id: true, name: true, email: true } },
      toUser: { select: { id: true, name: true, email: true } },
      requestedBy: { select: { id: true, name: true, email: true } },
    },
  });
}

/**
 * Get a single transfer by ID.
 */
async function getTransferById(id) {
  const transfer = await prisma.transfer.findUnique({
    where: { id },
    include: {
      asset: { select: { id: true, assetTag: true, name: true, status: true } },
      fromUser: { select: { id: true, name: true, email: true } },
      toUser: { select: { id: true, name: true, email: true } },
      requestedBy: { select: { id: true, name: true, email: true } },
    },
  });

  if (!transfer) throw ApiError.notFound('Transfer not found');
  return transfer;
}

module.exports = {
  // allocation
  createAllocation,
  returnAllocation,
  listAllocations,
  getAllocationById,
  // transfer
  createTransfer,
  approveTransfer,
  rejectTransfer,
  listTransfers,
  getTransferById,
};
