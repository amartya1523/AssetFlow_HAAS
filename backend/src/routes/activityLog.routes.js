const express = require('express');
const { query } = require('express-validator');

const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const { logActivity } = require('../services/activityLog.service');
const prisma = require('../config/prisma');

const router = express.Router();

/**
 * GET /api/v1/activity-logs
 * Admin and Asset Manager can view all activity logs.
 * Query: entityType?, entityId?, limit? (default 50, max 200)
 */
router.get(
  '/',
  authenticate,
  authorize('ADMIN', 'ASSET_MANAGER'),
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 200 })
      .withMessage('limit must be an integer between 1 and 200'),
    query('entityType').optional().isString(),
    query('entityId').optional().isString(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { entityType, entityId, limit = 50 } = req.query;
    const where = {};
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;

    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(Number(limit), 200),
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    return sendSuccess(res, { data: logs });
  }),
);

module.exports = router;
