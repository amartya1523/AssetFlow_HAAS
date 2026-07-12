const express = require('express');
const { body, param } = require('express-validator');

const auditController = require('../controllers/audit.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// ─── Audit Item Routes ────────────────────────────────────────────────────────

/**
 * PUT /api/v1/audit-items/:id
 * Update an audit item's verification result and/or notes.
 * Allowed roles: ADMIN, ASSET_MANAGER, DEPARTMENT_HEAD, EMPLOYEE (any auditor).
 * The service blocks edits once the parent cycle is CLOSED.
 */
router.put(
  '/:id',
  authenticate,
  [
    param('id').notEmpty().withMessage('id is required'),
    body('result')
      .optional({ nullable: true })
      .isIn(['VERIFIED', 'MISSING', 'DAMAGED'])
      .withMessage('result must be one of: VERIFIED, MISSING, DAMAGED'),
    body('notes')
      .optional({ nullable: true })
      .isString()
      .withMessage('notes must be a string'),
  ],
  validate,
  auditController.updateAuditItem,
);

module.exports = router;
