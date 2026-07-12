const express = require('express');
const { query } = require('express-validator');

const dashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

/**
 * GET /api/v1/dashboard/kpis
 * Returns all KPI numbers for the dashboard. All authenticated users.
 */
router.get(
  '/kpis',
  authenticate,
  dashboardController.getKPIs,
);

/**
 * GET /api/v1/dashboard/recent-activity
 * Query: limit? (1–100, default 20)
 */
router.get(
  '/recent-activity',
  authenticate,
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
