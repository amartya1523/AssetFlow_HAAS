const express = require('express');
const { body, query, param } = require('express-validator');

const bookingController = require('../controllers/booking.controller');
const { authenticate } = require('../middleware/auth');
const { requireTenantScope } = require('../middleware/tenantScope');
const validate = require('../middleware/validate');
const { requirePermission } = require('../utils/permissions');

const router = express.Router();

router.use(authenticate, requireTenantScope);

// POST /api/v1/bookings
router.post(
  '/',
  requirePermission('booking:create'),
  [
    body('assetId').isUUID().withMessage('assetId must be a valid UUID'),
    body('startTime')
      .isISO8601()
      .withMessage('startTime must be a valid ISO 8601 date'),
    body('endTime')
      .isISO8601()
      .withMessage('endTime must be a valid ISO 8601 date'),
  ],
  validate,
  bookingController.createBooking
);

// GET /api/v1/bookings
router.get(
  '/',
  requirePermission('booking:read'),
  [
    query('assetId').optional().isUUID().withMessage('assetId must be a valid UUID'),
    query('bookedById').optional().isUUID().withMessage('bookedById must be a valid UUID'),
    query('status')
      .optional()
      .isIn(['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'])
      .withMessage('status must be UPCOMING, ONGOING, COMPLETED, or CANCELLED'),
  ],
  validate,
  bookingController.listBookings
);

// PUT /api/v1/bookings/:id/cancel
router.put(
  '/:id/cancel',
  requirePermission('booking:cancel'),
  [param('id').isUUID().withMessage('id must be a valid UUID')],
  validate,
  bookingController.cancelBooking
);

// PUT /api/v1/bookings/:id/reschedule
router.put(
  '/:id/reschedule',
  requirePermission('booking:cancel'),
  [
    param('id').isUUID().withMessage('id must be a valid UUID'),
    body('startTime')
      .isISO8601()
      .withMessage('startTime must be a valid ISO 8601 date'),
    body('endTime')
      .isISO8601()
      .withMessage('endTime must be a valid ISO 8601 date'),
  ],
  validate,
  bookingController.rescheduleBooking
);

module.exports = router;
