const express = require('express');
const { body, query, param } = require('express-validator');

const allocationController = require('../controllers/allocation.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { requireTenantScope } = require('../middleware/tenantScope');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(authenticate, requireTenantScope);

// POST /api/v1/transfers — request a transfer (any authenticated user)
router.post(
  '/',
  [
    body('assetId').notEmpty().withMessage('assetId is required'),
    body('toUserId').notEmpty().withMessage('toUserId is required'),
    body('reason')
      .trim()
      .notEmpty()
      .withMessage('reason is required')
      .isLength({ min: 5 })
      .withMessage('reason must be at least 5 characters'),
    body('fromUserId')
      .optional({ nullable: true })
      .isString()
      .withMessage('fromUserId must be a string'),
  ],
  validate,
  allocationController.createTransfer,
);

// GET /api/v1/transfers — list transfers
router.get(
  '/',
  authorize('ASSET_MANAGER', 'ADMIN', 'DEPARTMENT_HEAD', 'EMPLOYEE'),
  [
    query('status')
      .optional()
      .isIn(['REQUESTED', 'APPROVED', 'REJECTED', 'COMPLETED'])
      .withMessage('status must be REQUESTED, APPROVED, REJECTED, or COMPLETED'),
  ],
  validate,
  allocationController.listTransfers,
);

// GET /api/v1/transfers/:id — get single transfer
router.get(
  '/:id',
  authorize('ASSET_MANAGER', 'ADMIN', 'DEPARTMENT_HEAD', 'EMPLOYEE'),
  [param('id').notEmpty().withMessage('id is required')],
  validate,
  allocationController.getTransferById,
);

// PUT /api/v1/transfers/:id/approve — approve a pending transfer
router.put(
  '/:id/approve',
  authorize('ASSET_MANAGER', 'ADMIN', 'DEPARTMENT_HEAD'),
  [param('id').notEmpty().withMessage('id is required')],
  validate,
  allocationController.approveTransfer,
);

// PUT /api/v1/transfers/:id/reject — reject a pending transfer
router.put(
  '/:id/reject',
  authorize('ASSET_MANAGER', 'ADMIN', 'DEPARTMENT_HEAD'),
  [param('id').notEmpty().withMessage('id is required')],
  validate,
  allocationController.rejectTransfer,
);

module.exports = router;
