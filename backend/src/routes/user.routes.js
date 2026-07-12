const express = require('express');
const { body, param, query } = require('express-validator');

const userController = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth');
const { requireTenantScope } = require('../middleware/tenantScope');
const validate = require('../middleware/validate');
const { requirePermission, ALL_ACTIONS } = require('../utils/permissions');

const router = express.Router();

router.use(authenticate, requireTenantScope);

const idParam = [param('id').isUUID().withMessage('id must be a valid UUID')];
const tenantRoles = ['EMPLOYEE', 'DEPARTMENT_HEAD', 'ASSET_MANAGER', 'ADMIN'];

router.get(
  '/',
  requirePermission('users:read'),
  [
    query('role').optional().isIn(tenantRoles).withMessage('Invalid role'),
    query('status').optional().isIn(['ACTIVE', 'INACTIVE']).withMessage('Invalid status'),
    query('departmentId').optional().isUUID().withMessage('departmentId must be a valid UUID'),
    query('search').optional().trim().isString().withMessage('search must be a string'),
  ],
  validate,
  userController.listUsers,
);

router.post(
  '/',
  requirePermission('users:create'),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone').optional({ nullable: true }).isString().withMessage('phone must be a string'),
    body('role').optional().isIn(tenantRoles).withMessage('Invalid role'),
    body('status').optional().isIn(['ACTIVE', 'INACTIVE']).withMessage('Invalid status'),
    body('departmentId').optional({ nullable: true }).isUUID().withMessage('departmentId must be a valid UUID'),
  ],
  validate,
  userController.createUser,
);

router.put(
  '/:id',
  requirePermission('users:update'),
  [
    ...idParam,
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('phone').optional({ nullable: true }).isString().withMessage('phone must be a string'),
    body('role').optional().isIn(tenantRoles).withMessage('Invalid role'),
    body('status').optional().isIn(['ACTIVE', 'INACTIVE']).withMessage('Invalid status'),
    body('departmentId').optional({ nullable: true }).isUUID().withMessage('departmentId must be a valid UUID'),
  ],
  validate,
  userController.updateUser,
);

router.get(
  '/:id/permissions',
  requirePermission('users:permissions'),
  idParam,
  validate,
  userController.getPermissions,
);

router.put(
  '/:id/permissions',
  requirePermission('users:permissions'),
  [
    ...idParam,
    body('overrides').isArray().withMessage('overrides must be an array'),
    body('overrides.*.permissionKey').isIn(ALL_ACTIONS).withMessage('Unknown permission'),
    body('overrides.*.effect').isIn(['GRANT', 'REVOKE']).withMessage('effect must be GRANT or REVOKE'),
  ],
  validate,
  userController.updatePermissions,
);

module.exports = router;
