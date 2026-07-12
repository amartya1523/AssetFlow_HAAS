const express = require('express');
const { query } = require('express-validator');

const dashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth');
const { requireTenantScope } = require('../middleware/tenantScope');
const validate = require('../middleware/validate');
const { requirePermission } = require('../utils/permissions');

const router = express.Router();

// GET /api/v1/dashboard — get overview stats (scoped)
router.get(
  '/',
  authenticate,
  requireTenantScope,
  requirePermission('dashboard:view'),
  dashboardController.getOverview,
);

/**
 * GET /api/v1/dashboard/kpis
 * Returns all KPI numbers for the dashboard. All authenticated users.
 */
router.get(
  '/kpis',
  authenticate,
  requireTenantScope,
  requirePermission('dashboard:view'),
  dashboardController.getKPIs,
);

router.get(
  '/recent-activity',
  authenticate,
  requireTenantScope,
  requirePermission('dashboard:view'),
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('limit must be an integer between 1 and 100'),
  ],
  validate,
  dashboardController.getRecentActivity,
);

module.exports = router;
