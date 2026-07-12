const express = require('express');
const { body, param, query } = require('express-validator');

const assetController = require('../controllers/asset.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { requirePermission } = require('../utils/permissions');
const { STATUS_VALUES } = require('../services/asset.service');

const router = express.Router();

router.use(authenticate);

const assetIdParam = [param('id').isUUID().withMessage('id must be a valid UUID')];

const assetBodyValidators = [
  body('status')
    .not()
    .exists()
    .withMessage('Asset status is controlled by lifecycle modules and cannot be edited here'),
  body('name').optional().trim().notEmpty().withMessage('Asset name cannot be empty'),
  body('categoryId').optional().isUUID().withMessage('categoryId must be a valid UUID'),
  body('departmentId').optional({ nullable: true }).isUUID().withMessage('departmentId must be a valid UUID'),
  body('serialNumber').optional({ nullable: true }).isString().withMessage('serialNumber must be a string'),
  body('acquisitionDate').optional({ nullable: true }).isISO8601().withMessage('acquisitionDate must be a valid ISO 8601 date'),
  body('acquisitionCost').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('acquisitionCost must be a non-negative number'),
  body('condition').optional({ nullable: true }).isString().withMessage('condition must be a string'),
  body('location').optional({ nullable: true }).isString().withMessage('location must be a string'),
  body('photoUrl').optional({ nullable: true }).isURL().withMessage('photoUrl must be a valid URL'),
  body('isBookable').optional().isBoolean().withMessage('isBookable must be true or false'),
];

router.post(
  '/',
  requirePermission('assets:create'),
  [
    body('name').trim().notEmpty().withMessage('Asset name is required'),
    body('categoryId').isUUID().withMessage('categoryId must be a valid UUID'),
    ...assetBodyValidators,
  ],
  validate,
  assetController.createAsset,
);

router.get(
  '/',
  requirePermission('assets:read'),
  [
    query('search').optional().trim().isString().withMessage('search must be a string'),
    query('categoryId').optional().isUUID().withMessage('categoryId must be a valid UUID'),
    query('departmentId').optional().isUUID().withMessage('departmentId must be a valid UUID'),
    query('status').optional().isIn(STATUS_VALUES).withMessage('Invalid asset status'),
    query('isBookable').optional().isBoolean().withMessage('isBookable must be true or false'),
  ],
  validate,
  assetController.listAssets,
);

router.get(
  '/:id/history',
  requirePermission('assets:read-history'),
  assetIdParam,
  validate,
  assetController.getAssetHistory,
);

router.get(
  '/:id',
  requirePermission('assets:read'),
  assetIdParam,
  validate,
  assetController.getAssetById,
);

router.put(
  '/:id',
  requirePermission('assets:update'),
  [
    ...assetIdParam,
    ...assetBodyValidators,
  ],
  validate,
  assetController.updateAsset,
);

module.exports = router;
