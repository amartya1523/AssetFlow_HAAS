const express = require('express');
const { body, param, query } = require('express-validator');

const platformController = require('../controllers/platform.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { requirePermission } = require('../utils/permissions');

const router = express.Router();

router.use(authenticate, authorize('SUPER_ADMIN'));

router.get(
  '/organizations',
  requirePermission('platform:organizations:read'),
  [
    query('status').optional().isIn(['ACTIVE', 'INACTIVE']).withMessage('Invalid status'),
    query('search').optional().trim().isString().withMessage('search must be a string'),
  ],
  validate,
  platformController.listOrganizations,
);

router.get(
  '/organizations/:id',
  requirePermission('platform:organizations:read'),
  [param('id').notEmpty().withMessage('id is required')],
  validate,
  platformController.getOrganization,
);

router.put(
  '/organizations/:id/status',
  requirePermission('platform:organizations:update'),
  [
    param('id').notEmpty().withMessage('id is required'),
    body('status').isIn(['ACTIVE', 'INACTIVE']).withMessage('status must be ACTIVE or INACTIVE'),
  ],
  validate,
  platformController.updateOrganizationStatus,
);

router.get(
  '/organizations/:id/assets',
  requirePermission('platform:assets:read'),
  [
    param('id').notEmpty().withMessage('id is required'),
    query('status').optional().isString().withMessage('status must be a string'),
    query('categoryId').optional().isUUID().withMessage('categoryId must be a valid UUID'),
    query('departmentId').optional().isUUID().withMessage('departmentId must be a valid UUID'),
    query('search').optional().trim().isString().withMessage('search must be a string'),
  ],
  validate,
  platformController.listOrganizationAssets,
);

module.exports = router;
