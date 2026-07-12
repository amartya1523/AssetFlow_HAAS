const express = require('express');
const { param, query } = require('express-validator');

const notificationController = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// All notification routes require authentication.
// No additional role guard — users can only see/update their own notifications
// (enforced in the service layer).

/**
 * GET /api/v1/notifications
 * Query: category? (ALERT | APPROVAL | BOOKING | GENERAL)
 */
router.get(
  '/',
  authenticate,
  [
    query('category')
      .optional()
      .isIn(['ALERT', 'APPROVAL', 'BOOKING', 'GENERAL'])
      .withMessage('category must be one of: ALERT, APPROVAL, BOOKING, GENERAL'),
  ],
  validate,
  notificationController.listNotifications,
);

/**
 * GET /api/v1/notifications/unread-count
 * Must be declared before /:id to avoid route shadowing.
 */
router.get(
  '/unread-count',
  authenticate,
  notificationController.getUnreadCount,
);

/**
 * PUT /api/v1/notifications/read-all
 * Marks all of the calling user's notifications as read.
 * Must be declared before /:id/read to avoid route shadowing.
 */
router.put(
  '/read-all',
  authenticate,
  notificationController.markAllRead,
);

/**
 * PUT /api/v1/notifications/:id/read
 * Mark a single notification as read.
 */
router.put(
  '/:id/read',
  authenticate,
  [param('id').notEmpty().withMessage('id is required')],
  validate,
  notificationController.markRead,
);

module.exports = router;
