const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const notificationService = require('../services/notification.service');

/**
 * GET /api/v1/notifications
 * Query: category? (ALERT | APPROVAL | BOOKING | GENERAL)
 * Returns the authenticated user's notifications, newest first.
 */
const listNotifications = asyncHandler(async (req, res) => {
  const { category } = req.query;
  const notifications = await notificationService.listNotifications({
    userId: req.user.userId,
    category,
  });
  return sendSuccess(res, { data: notifications });
});

/**
 * GET /api/v1/notifications/unread-count
 * Returns the count of unread notifications for the calling user.
 */
const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await notificationService.unreadCount(req.user.userId);
  return sendSuccess(res, { data: { unreadCount: count } });
});

/**
 * PUT /api/v1/notifications/:id/read
 * Marks a single notification as read. Validates the notification belongs
 * to the calling user.
 */
const markRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markRead(req.params.id, req.user.userId);
  return sendSuccess(res, { data: notification, message: 'Notification marked as read' });
});

/**
 * PUT /api/v1/notifications/read-all
 * Marks all of the calling user's unread notifications as read.
 */
const markAllRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllRead(req.user.userId);
  return sendSuccess(res, { data: result, message: 'All notifications marked as read' });
});

module.exports = {
  listNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
};
