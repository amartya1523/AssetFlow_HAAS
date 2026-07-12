const express = require('express');

const reportsController = require('../controllers/reports.controller');
const { authenticate } = require('../middleware/auth');
const { requireTenantScope } = require('../middleware/tenantScope');
const { requirePermission } = require('../utils/permissions');

const router = express.Router();

router.use(authenticate, requireTenantScope);

router.get(
  '/summary',
  requirePermission('reports:view'),
  reportsController.getSummary,
);

router.get(
  '/export',
  requirePermission('reports:export'),
  reportsController.exportReport,
);

module.exports = router;
