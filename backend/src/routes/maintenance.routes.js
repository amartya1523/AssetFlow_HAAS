const express = require('express');
const { body, query, param } = require('express-validator');

const maintenanceController = require('../controllers/maintenance.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// POST /api/v1/maintenance
router.post(
  '/',
  authenticate,
  [
    body('assetId')
      .notEmpty()
      .withMessage('assetId is required')
      .isUUID()
      .withMessage('Please select a valid asset'),
    body('issueDescription').notEmpty().withMessage('issueDescription is required'),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH']),
    body('photoUrl')
      .optional({ checkFalsy: true })
      .isURL()
      .withMessage('photoUrl must be a valid URL'),
  ],
  validate,
  maintenanceController.createRequest
);

// GET /api/v1/maintenance
router.get(
  '/',
  authenticate,
  [
    query('status').optional().isIn(['PENDING', 'APPROVED', 'REJECTED', 'TECHNICIAN_ASSIGNED', 'IN_PROGRESS', 'RESOLVED']),
  ],
  validate,
  maintenanceController.listRequests
);

// PUT /api/v1/maintenance/:id/approve
router.put(
  '/:id/approve',
  authenticate,
  authorize('ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'),
  [param('id').notEmpty().withMessage('id is required')],
  validate,
  maintenanceController.approveRequest
);

// PUT /api/v1/maintenance/:id/reject
router.put(
  '/:id/reject',
  authenticate,
  authorize('ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'),
  [
    param('id').notEmpty().withMessage('id is required'),
    body('rejectionReason').notEmpty().withMessage('rejectionReason is required for rejection'),
  ],
  validate,
  maintenanceController.rejectRequest
);

// PUT /api/v1/maintenance/:id/assign-technician
router.put(
  '/:id/assign-technician',
  authenticate,
  authorize('ADMIN', 'ASSET_MANAGER'),
  [
    param('id').notEmpty().withMessage('id is required'),
    body('technicianName').notEmpty().withMessage('technicianName is required'),
  ],
  validate,
  maintenanceController.assignTechnician
);

// PUT /api/v1/maintenance/:id/start
router.put(
  '/:id/start',
  authenticate,
  authorize('ADMIN', 'ASSET_MANAGER'),
  [param('id').notEmpty().withMessage('id is required')],
  validate,
  maintenanceController.startMaintenance
);

// PUT /api/v1/maintenance/:id/resolve
router.put(
  '/:id/resolve',
  authenticate,
  authorize('ADMIN', 'ASSET_MANAGER'),
  [param('id').notEmpty().withMessage('id is required')],
  validate,
  maintenanceController.resolveMaintenance
);

module.exports = router;
