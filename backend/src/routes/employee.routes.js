const express = require('express');
const { body, query } = require('express-validator');

const orgController = require('../controllers/organization.controller');
const { authenticate } = require('../middleware/auth');
const { requireTenantScope } = require('../middleware/tenantScope');
const validate = require('../middleware/validate');
const { requirePermission } = require('../utils/permissions');

const router = express.Router();

router.use(authenticate, requireTenantScope);

// GET /api/v1/employees — optional filters
router.get(
  '/',
  requirePermission('employees:read'),
  [
    query('role').optional().isIn(['EMPLOYEE', 'DEPARTMENT_HEAD', 'ASSET_MANAGER', 'ADMIN']).withMessage('Invalid role'),
    query('status').optional().isIn(['ACTIVE', 'INACTIVE']).withMessage('Invalid status'),
    query('departmentId').optional().isUUID().withMessage('departmentId must be a valid UUID'),
  ],
  validate,
  orgController.listEmployees,
);

// PUT /api/v1/employees/:id/role — the ONLY place a user's role can change.
router.put(
  '/:id/role',
  requirePermission('employees:update-role'),
  [body('role').isIn(['EMPLOYEE', 'DEPARTMENT_HEAD', 'ASSET_MANAGER', 'ADMIN']).withMessage('Invalid role')],
  validate,
  orgController.updateEmployeeRole,
);

module.exports = router;
