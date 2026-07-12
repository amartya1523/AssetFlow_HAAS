const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

// ─── Maintenance Service ─────────────────────────────────────────────────────

/**
 * POST /api/v1/maintenance
 * Create a new maintenance request. Does not change asset status.
 */
async function createRequest({ assetId, raisedById, issueDescription, priority, photoUrl }) {
  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) {
    throw ApiError.notFound('Asset not found');
  }

  const request = await prisma.maintenanceRequest.create({
    data: {
      assetId,
      raisedById,
      issueDescription,
      priority: priority || 'MEDIUM',
      photoUrl,
      status: 'PENDING',
    },
    include: {
      asset: { select: { id: true, assetTag: true, name: true, status: true } },
      raisedBy: { select: { id: true, name: true, email: true } },
    }
  });

  return request;
}

/**
 * GET /api/v1/maintenance
 * List maintenance requests.
 */
async function listRequests({ assetId, status } = {}) {
  const where = {};
  if (assetId) where.assetId = assetId;
  if (status) where.status = status;

  return await prisma.maintenanceRequest.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      asset: { select: { id: true, assetTag: true, name: true, status: true } },
      raisedBy: { select: { id: true, name: true, email: true } },
      approvedBy: { select: { id: true, name: true, email: true } },
    }
  });
}

/**
 * PUT /api/v1/maintenance/:id/approve
 * Approval changes asset to UNDER_MAINTENANCE.
 */
async function approveRequest(id, approvedById) {
  const req = await prisma.maintenanceRequest.findUnique({ where: { id } });
  if (!req) throw ApiError.notFound('Maintenance request not found');

  if (req.status !== 'PENDING') {
    throw ApiError.badRequest(`Cannot approve a request with status ${req.status}`);
  }

  // Use a transaction to ensure both updates succeed
  const [updatedReq] = await prisma.$transaction([
    prisma.maintenanceRequest.update({
      where: { id },
      data: { status: 'APPROVED', approvedById },
      include: {
        asset: { select: { id: true, assetTag: true, name: true, status: true } },
        approvedBy: { select: { id: true, name: true } },
      }
    }),
    prisma.asset.update({
      where: { id: req.assetId },
      data: { status: 'UNDER_MAINTENANCE' }
    })
  ]);

  return updatedReq;
}

/**
 * PUT /api/v1/maintenance/:id/reject
 */
async function rejectRequest(id, approvedById, rejectionReason) {
  const req = await prisma.maintenanceRequest.findUnique({ where: { id } });
  if (!req) throw ApiError.notFound('Maintenance request not found');

  if (req.status !== 'PENDING') {
    throw ApiError.badRequest(`Cannot reject a request with status ${req.status}`);
  }

  return await prisma.maintenanceRequest.update({
    where: { id },
    data: { status: 'REJECTED', approvedById, rejectionReason },
    include: {
      asset: { select: { id: true, assetTag: true, name: true, status: true } },
      approvedBy: { select: { id: true, name: true } },
    }
  });
}

/**
 * PUT /api/v1/maintenance/:id/assign-technician
 */
async function assignTechnician(id, technicianName) {
  const req = await prisma.maintenanceRequest.findUnique({ where: { id } });
  if (!req) throw ApiError.notFound('Maintenance request not found');

  if (req.status !== 'APPROVED') {
    throw ApiError.badRequest(`Cannot assign technician when status is ${req.status}`);
  }

  return await prisma.maintenanceRequest.update({
    where: { id },
    data: { status: 'TECHNICIAN_ASSIGNED', technicianName },
    include: {
      asset: { select: { id: true, assetTag: true, name: true, status: true } },
    }
  });
}

/**
 * PUT /api/v1/maintenance/:id/start
 */
async function startMaintenance(id) {
  const req = await prisma.maintenanceRequest.findUnique({ where: { id } });
  if (!req) throw ApiError.notFound('Maintenance request not found');

  if (req.status !== 'TECHNICIAN_ASSIGNED') {
    throw ApiError.badRequest(`Cannot start maintenance when status is ${req.status}`);
  }

  return await prisma.maintenanceRequest.update({
    where: { id },
    data: { status: 'IN_PROGRESS' },
    include: {
      asset: { select: { id: true, assetTag: true, name: true, status: true } },
    }
  });
}

/**
 * PUT /api/v1/maintenance/:id/resolve
 * Resolve changes asset back to AVAILABLE.
 */
async function resolveMaintenance(id) {
  const req = await prisma.maintenanceRequest.findUnique({ where: { id } });
  if (!req) throw ApiError.notFound('Maintenance request not found');

  if (req.status !== 'IN_PROGRESS') {
    throw ApiError.badRequest(`Cannot resolve maintenance when status is ${req.status}`);
  }

  // Transaction for safe rollback
  const [updatedReq] = await prisma.$transaction([
    prisma.maintenanceRequest.update({
      where: { id },
      data: { status: 'RESOLVED', resolvedAt: new Date() },
      include: {
        asset: { select: { id: true, assetTag: true, name: true, status: true } },
      }
    }),
    prisma.asset.update({
      where: { id: req.assetId },
      data: { status: 'AVAILABLE' }
    })
  ]);

  return updatedReq;
}

module.exports = {
  createRequest,
  listRequests,
  approveRequest,
  rejectRequest,
  assignTechnician,
  startMaintenance,
  resolveMaintenance,
};
