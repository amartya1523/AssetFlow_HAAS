const express = require('express');
const { body, query, param } = require('express-validator');

const allocationController = require('../controllers/allocation.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { requireTenantScope } = require('../middleware/tenantScope');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(authenticate, requireTenantScope);

// POST /api/v1/allocations — create a new allocation
router.post(
  '/',
  authorize('ASSET_MANAGER', 'ADMIN'),
  [
    body('assetId').notEmpty().withMessage('assetId is required'),
    body('allocatedToUserId')
      .optional({ nullable: true })
      .isString()
      .withMessage('allocatedToUserId must be a string'),
    body('allocatedToDepartmentId')
      .optional({ nullable: true })
      .isString()
      .withMessage('allocatedToDepartmentId must be a string'),
    body('expectedReturnDate')
      .optional({ nullable: true })
      .isISO8601()
      .withMessage('expectedReturnDate must be a valid ISO 8601 date'),
  ],
  validate,
  allocationController.createAllocation,
);

// GET /api/v1/allocations — list allocations with optional filters
router.get(
  '/',
  authorize('ASSET_MANAGER', 'ADMIN', 'DEPARTMENT_HEAD', 'EMPLOYEE'),
  [
    query('status')
      .optional()
      .isIn(['ACTIVE', 'RETURNED', 'OVERDUE'])
      .withMessage('status must be ACTIVE, RETURNED, or OVERDUE'),
  ],
  validate,
  allocationController.listAllocations,
);

// GET /api/v1/allocations/:id — get a single allocation
router.get(
  '/:id',
  [param('id').notEmpty().withMessage('id is required')],
  validate,
  allocationController.getAllocationById,
);

// PUT /api/v1/allocations/:id/return — return an asset
router.put(
  '/:id/return',
  authorize('ASSET_MANAGER', 'ADMIN', 'DEPARTMENT_HEAD'),
  [
    param('id').notEmpty().withMessage('id is required'),
    body('conditionNoteOnReturn')
      .optional({ nullable: true })
      .isString()
      .withMessage('conditionNoteOnReturn must be a string'),
  ],
  validate,
  allocationController.returnAllocation,
);

module.exports = router;
