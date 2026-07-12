const express = require('express');

const dashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth');
const { requireTenantScope } = require('../middleware/tenantScope');
const { requirePermission } = require('../utils/permissions');

const router = express.Router();

router.get(
  '/',
  authenticate,
  requireTenantScope,
  requirePermission('dashboard:view'),
  dashboardController.getOverview,
);

module.exports = router;
