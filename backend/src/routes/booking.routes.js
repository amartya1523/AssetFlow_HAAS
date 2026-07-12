const express = require('express');
const { body, query, param } = require('express-validator');

const bookingController = require('../controllers/booking.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// POST /api/v1/bookings
router.post(
  '/',
  authenticate,
  [
    body('assetId').notEmpty().withMessage('assetId is required'),
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
  authenticate,
  [
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
  authenticate,
  [param('id').notEmpty().withMessage('id is required')],
  validate,
  bookingController.cancelBooking
);

// PUT /api/v1/bookings/:id/reschedule
router.put(
  '/:id/reschedule',
  authenticate,
  [
    param('id').notEmpty().withMessage('id is required'),
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
