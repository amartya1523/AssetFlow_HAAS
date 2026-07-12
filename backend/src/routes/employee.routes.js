const express = require('express');
const { body, query } = require('express-validator');

const orgController = require('../controllers/organization.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// Every organization master-data endpoint is admin-only.
router.use(authenticate, authorize('ADMIN'));

// GET /api/v1/employees — optional filters
router.get(
  '/',
  [
    query('role').optional().isIn(['EMPLOYEE', 'DEPARTMENT_HEAD', 'ASSET_MANAGER', 'ADMIN']).withMessage('Invalid role'),
    query('departmentId').optional().isUUID().withMessage('departmentId must be a valid UUID'),
  ],
  validate,
  orgController.listEmployees,
);

// PUT /api/v1/employees/:id/role — the ONLY place a user's role can change.
router.put(
  '/:id/role',
  [body('role').isIn(['EMPLOYEE', 'DEPARTMENT_HEAD', 'ASSET_MANAGER', 'ADMIN']).withMessage('Invalid role')],
  validate,
  orgController.updateEmployeeRole,
);

module.exports = router;
