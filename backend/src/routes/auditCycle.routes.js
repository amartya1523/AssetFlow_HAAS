const express = require('express');
const { body, param, query } = require('express-validator');

const auditController = require('../controllers/audit.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// ─── Audit Cycle Routes ──────────────────────────────────────────────────────

/**
 * POST /api/v1/audit-cycles
 * Create a new audit cycle. Only ADMIN and ASSET_MANAGER can create cycles.
 * Auto-generates scoped AuditItems from matching assets.
 */
router.post(
  '/',
  authenticate,
  authorize('ADMIN', 'ASSET_MANAGER'),
  [
    body('name')
      .notEmpty()
      .withMessage('name is required'),
    body('startDate')
      .notEmpty()
      .isISO8601()
      .withMessage('startDate must be a valid ISO 8601 date'),
    body('endDate')
      .notEmpty()
      .isISO8601()
      .withMessage('endDate must be a valid ISO 8601 date'),
    body('scopeDepartmentId')
      .optional({ nullable: true })
      .isString()
      .withMessage('scopeDepartmentId must be a string'),
    body('scopeLocation')
      .optional({ nullable: true })
      .isString()
      .withMessage('scopeLocation must be a string'),
    body('auditorIds')
      .optional({ nullable: true })
      .isArray()
      .withMessage('auditorIds must be an array of user IDs'),
    body('auditorIds.*')
      .optional()
      .isString()
      .withMessage('Each auditorId must be a string'),
  ],
  validate,
  auditController.createCycle,
);

/**
 * GET /api/v1/audit-cycles
 * List all audit cycles. All authenticated users can view.
 */
router.get(
  '/',
  authenticate,
  auditController.listCycles,
);

/**
 * GET /api/v1/audit-cycles/:id
 * Retrieve a single audit cycle with all items and progress.
 */
router.get(
  '/:id',
  authenticate,
  [param('id').notEmpty().withMessage('id is required')],
  validate,
  auditController.getCycleById,
);

/**
 * GET /api/v1/audit-cycles/:id/discrepancy-report
 * Return only non-verified items for this cycle.
 * Must appear BEFORE the /:id/close route to avoid route shadowing.
 */
router.get(
  '/:id/discrepancy-report',
  authenticate,
  [param('id').notEmpty().withMessage('id is required')],
  validate,
  auditController.getDiscrepancyReport,
);

/**
 * PUT /api/v1/audit-cycles/:id/close
 * Close the audit cycle. Only ADMIN and ASSET_MANAGER.
 * Irreversible — marks unresolved items as MISSING.
 */
router.put(
  '/:id/close',
  authenticate,
  authorize('ADMIN', 'ASSET_MANAGER'),
  [param('id').notEmpty().withMessage('id is required')],
  validate,
  auditController.closeCycle,
);

module.exports = router;
