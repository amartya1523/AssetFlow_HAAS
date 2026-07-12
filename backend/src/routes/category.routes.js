const express = require('express');
const { body } = require('express-validator');

const orgController = require('../controllers/organization.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// Every organization master-data endpoint is admin-only.
router.use(authenticate, authorize('ADMIN'));

// GET /api/v1/categories
router.get('/', orgController.listCategories);

// POST /api/v1/categories
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Category name is required'),
    body('status').optional().isIn(['ACTIVE', 'INACTIVE']).withMessage('status must be ACTIVE or INACTIVE'),
    // extraFieldsSchema is optional JSON; express-validator leaves objects alone.
  ],
  validate,
  orgController.createCategory,
);

// PUT /api/v1/categories/:id
router.put(
  '/:id',
  [
    body('name').optional().trim().notEmpty().withMessage('Category name cannot be empty'),
    body('status').optional().isIn(['ACTIVE', 'INACTIVE']).withMessage('status must be ACTIVE or INACTIVE'),
  ],
  validate,
  orgController.updateCategory,
);

// DELETE /api/v1/categories/:id
router.delete('/:id', orgController.deleteCategory);

module.exports = router;
