const express = require('express');
const { body } = require('express-validator');

const orgController = require('../controllers/organization.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { requireTenantScope } = require('../middleware/tenantScope');
const validate = require('../middleware/validate');

const router = express.Router();

// Every organization master-data endpoint is admin-only.
router.use(authenticate, requireTenantScope, authorize('ADMIN'));

// GET /api/v1/departments
router.get('/', orgController.listDepartments);

// POST /api/v1/departments
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Department name is required'),
    body('code').trim().notEmpty().withMessage('Department code is required'),
    body('headId').optional().isUUID().withMessage('headId must be a valid UUID'),
    body('parentDepartmentId').optional().isUUID().withMessage('parentDepartmentId must be a valid UUID'),
    body('status').optional().isIn(['ACTIVE', 'INACTIVE']).withMessage('status must be ACTIVE or INACTIVE'),
  ],
  validate,
  orgController.createDepartment,
);

// PUT /api/v1/departments/:id
router.put(
  '/:id',
  [
    body('name').optional().trim().notEmpty().withMessage('Department name cannot be empty'),
    body('code').optional().trim().notEmpty().withMessage('Department code cannot be empty'),
    body('headId').optional().isUUID().withMessage('headId must be a valid UUID'),
    body('parentDepartmentId').optional().isUUID().withMessage('parentDepartmentId must be a valid UUID'),
    body('status').optional().isIn(['ACTIVE', 'INACTIVE']).withMessage('status must be ACTIVE or INACTIVE'),
  ],
  validate,
  orgController.updateDepartment,
);

// DELETE /api/v1/departments/:id
router.delete('/:id', orgController.deleteDepartment);

module.exports = router;
