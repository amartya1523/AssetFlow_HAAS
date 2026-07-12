const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendCreated } = require('../utils/apiResponse');
const maintenanceService = require('../services/maintenance.service');
const { logActivity } = require('../services/activityLog.service');
const notificationService = require('../services/notification.service');
const prisma = require('../config/prisma');

/**
 * POST /api/v1/maintenance
 * Body: { assetId, issueDescription, priority, photoUrl }
 */
const createRequest = asyncHandler(async (req, res) => {
  const { assetId, issueDescription, priority, photoUrl } = req.body;
  const request = await maintenanceService.createRequest({
    assetId,
    raisedById: req.user.userId,
    issueDescription,
    priority,
    photoUrl,
  });

  logActivity({
    userId:     req.user.userId,
    action:     'MAINTENANCE_RAISED',
    entityType: 'MaintenanceRequest',
    entityId:   request.id,
    metadata:   { assetId, issueDescription, priority },
  });
  // Notify all ASSET_MANAGER and ADMIN users
  const managers = await prisma.user.findMany({
    where: { role: { in: ['ASSET_MANAGER', 'ADMIN'] } },
    select: { id: true },
  });
  notificationService.notifyMaintenanceRaised({
    managerUserIds:   managers.map((m) => m.id),
    assetTag:         request.asset?.assetTag,
    issueDescription: issueDescription?.slice(0, 100),
  });

  return sendCreated(res, request);
});

/**
 * GET /api/v1/maintenance
 * Query: assetId, status
 */
const listRequests = asyncHandler(async (req, res) => {
  const { assetId, status } = req.query;
  const requests = await maintenanceService.listRequests({ assetId, status });
  return sendSuccess(res, { data: requests });
});

/**
 * PUT /api/v1/maintenance/:id/approve
 */
const approveRequest = asyncHandler(async (req, res) => {
  const request = await maintenanceService.approveRequest(req.params.id, req.user.userId);

  logActivity({
    userId:     req.user.userId,
    action:     'MAINTENANCE_APPROVED',
    entityType: 'MaintenanceRequest',
    entityId:   request.id,
    metadata:   { assetId: request.assetId },
  });
  notificationService.notifyMaintenanceApproved({
    raisedById: request.raisedById,
    assetTag:   request.asset?.assetTag,
  });

  return sendSuccess(res, { data: request, message: 'Maintenance request approved' });
});

/**
 * PUT /api/v1/maintenance/:id/reject
 * Body: { rejectionReason }
 */
const rejectRequest = asyncHandler(async (req, res) => {
  const { rejectionReason } = req.body;
  const request = await maintenanceService.rejectRequest(req.params.id, req.user.userId, rejectionReason);

  logActivity({
    userId:     req.user.userId,
    action:     'MAINTENANCE_REJECTED',
    entityType: 'MaintenanceRequest',
    entityId:   request.id,
    metadata:   { assetId: request.assetId, rejectionReason },
  });
  notificationService.notifyMaintenanceRejected({
    raisedById:      request.raisedById,
    assetTag:        request.asset?.assetTag,
    rejectionReason,
  });

  return sendSuccess(res, { data: request, message: 'Maintenance request rejected' });
});

/**
 * PUT /api/v1/maintenance/:id/assign-technician
 * Body: { technicianName }
 */
const assignTechnician = asyncHandler(async (req, res) => {
  const { technicianName } = req.body;
  const request = await maintenanceService.assignTechnician(req.params.id, technicianName);
  return sendSuccess(res, { data: request, message: 'Technician assigned successfully' });
});

/**
 * PUT /api/v1/maintenance/:id/start
 */
const startMaintenance = asyncHandler(async (req, res) => {
  const request = await maintenanceService.startMaintenance(req.params.id);
  return sendSuccess(res, { data: request, message: 'Maintenance started' });
});

/**
 * PUT /api/v1/maintenance/:id/resolve
 */
const resolveMaintenance = asyncHandler(async (req, res) => {
  const request = await maintenanceService.resolveMaintenance(req.params.id);

  logActivity({
    userId:     req.user.userId,
    action:     'MAINTENANCE_RESOLVED',
    entityType: 'MaintenanceRequest',
    entityId:   request.id,
    metadata:   { assetId: request.assetId },
  });
  notificationService.notifyMaintenanceResolved({
    raisedById: request.raisedById,
    assetTag:   request.asset?.assetTag,
  });

  return sendSuccess(res, { data: request, message: 'Maintenance resolved successfully' });
});

module.exports = {
  createRequest,
  listRequests,
  approveRequest,
  rejectRequest,
  assignTechnician,
  startMaintenance,
  resolveMaintenance,
};
