const prisma = require('../config/prisma');

/**
 * Centralized notification service.
 *
 * All workflow modules call `createNotification` (or the convenience wrappers)
 * to dispatch user-facing notifications. Keeping this concern here means
 * Task 19's sync step only touches call sites, not the notification schema.
 *
 * Notification is best-effort: failures are swallowed so a notification
 * bug never breaks the upstream business operation.
 *
 * Category mapping from the task spec:
 *   ALERT    — overdue returns, audit discrepancy
 *   APPROVAL — maintenance and transfer decisions
 *   BOOKING  — confirmed, changed, cancelled bookings
 *   GENERAL  — assignments and other useful updates
 */

/**
 * Core create — writes one Notification row.
 *
 * @param {object} params
 * @param {string}  params.userId   - recipient user ID
 * @param {string}  params.category - ALERT | APPROVAL | BOOKING | GENERAL
 * @param {string}  params.type     - machine-readable event key e.g. ASSET_ALLOCATED
 * @param {string}  params.message  - human-readable message shown in the UI
 * @returns {Promise<void>}
 */
async function createNotification({ userId, category, type, message }) {
  try {
    await prisma.notification.create({
      data: { userId, category, type, message },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[NOTIFICATION] failed to create "${type}" for user ${userId}:`, err.message);
  }
}

/**
 * Broadcast the same notification to multiple users at once.
 *
 * @param {string[]} userIds
 * @param {{ category, type, message }} params
 */
async function broadcastNotification(userIds, { category, type, message }) {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (unique.length === 0) return;
  await Promise.all(
    unique.map((userId) => createNotification({ userId, category, type, message })),
  );
}

// ─── GENERAL / BOOKING convenience wrappers ───────────────────────────────────

/** Asset allocated to a user */
async function notifyAssetAllocated({ toUserId, assetTag, assetName }) {
  await createNotification({
    userId:   toUserId,
    category: 'GENERAL',
    type:     'ASSET_ALLOCATED',
    message:  `Asset ${assetTag} (${assetName}) has been allocated to you.`,
  });
}

/** Asset returned */
async function notifyAssetReturned({ toUserId, assetTag, assetName }) {
  await createNotification({
    userId:   toUserId,
    category: 'GENERAL',
    type:     'ASSET_RETURNED',
    message:  `Asset ${assetTag} (${assetName}) has been marked as returned.`,
  });
}

/** Transfer requested — notify the current holder */
async function notifyTransferRequested({ toUserId, assetTag, reason }) {
  await createNotification({
    userId:   toUserId,
    category: 'APPROVAL',
    type:     'TRANSFER_REQUESTED',
    message:  `A transfer request was submitted for ${assetTag}. Reason: ${reason}`,
  });
}

/** Transfer approved — notify both parties */
async function notifyTransferApproved({ fromUserId, toUserId, assetTag }) {
  await broadcastNotification([fromUserId, toUserId], {
    category: 'APPROVAL',
    type:     'TRANSFER_APPROVED',
    message:  `Transfer of ${assetTag} has been approved.`,
  });
}

/** Transfer rejected */
async function notifyTransferRejected({ requestedById, assetTag }) {
  await createNotification({
    userId:   requestedById,
    category: 'APPROVAL',
    type:     'TRANSFER_REJECTED',
    message:  `Transfer request for ${assetTag} was rejected.`,
  });
}

/** Booking confirmed */
async function notifyBookingCreated({ toUserId, assetName, startTime, endTime }) {
  const fmt = (d) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  await createNotification({
    userId:   toUserId,
    category: 'BOOKING',
    type:     'BOOKING_CREATED',
    message:  `Your booking for ${assetName} is confirmed: ${fmt(startTime)} – ${fmt(endTime)}.`,
  });
}

/** Booking cancelled */
async function notifyBookingCancelled({ toUserId, assetName }) {
  await createNotification({
    userId:   toUserId,
    category: 'BOOKING',
    type:     'BOOKING_CANCELLED',
    message:  `Your booking for ${assetName} has been cancelled.`,
  });
}

/** Booking rescheduled */
async function notifyBookingRescheduled({ toUserId, assetName, startTime, endTime }) {
  const fmt = (d) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  await createNotification({
    userId:   toUserId,
    category: 'BOOKING',
    type:     'BOOKING_RESCHEDULED',
    message:  `Your booking for ${assetName} has been rescheduled to ${fmt(startTime)} – ${fmt(endTime)}.`,
  });
}

/** Maintenance request submitted — notify asset manager(s) */
async function notifyMaintenanceRaised({ managerUserIds, assetTag, issueDescription }) {
  await broadcastNotification(managerUserIds, {
    category: 'APPROVAL',
    type:     'MAINTENANCE_RAISED',
    message:  `Maintenance request raised for ${assetTag}: ${issueDescription}`,
  });
}

/** Maintenance approved — notify the requester */
async function notifyMaintenanceApproved({ raisedById, assetTag }) {
  await createNotification({
    userId:   raisedById,
    category: 'APPROVAL',
    type:     'MAINTENANCE_APPROVED',
    message:  `Your maintenance request for ${assetTag} has been approved. Asset is now Under Maintenance.`,
  });
}

/** Maintenance rejected */
async function notifyMaintenanceRejected({ raisedById, assetTag, rejectionReason }) {
  await createNotification({
    userId:   raisedById,
    category: 'APPROVAL',
    type:     'MAINTENANCE_REJECTED',
    message:  `Maintenance request for ${assetTag} was rejected. Reason: ${rejectionReason || 'No reason provided.'}`,
  });
}

/** Maintenance resolved */
async function notifyMaintenanceResolved({ raisedById, assetTag }) {
  await createNotification({
    userId:   raisedById,
    category: 'APPROVAL',
    type:     'MAINTENANCE_RESOLVED',
    message:  `Maintenance for ${assetTag} is complete. Asset is now Available.`,
  });
}

/** Audit cycle closed with discrepancies */
async function notifyAuditDiscrepancy({ createdById, cycleName, discrepancyCount }) {
  if (discrepancyCount === 0) return;
  await createNotification({
    userId:   createdById,
    category: 'ALERT',
    type:     'AUDIT_DISCREPANCY',
    message:  `Audit cycle "${cycleName}" closed with ${discrepancyCount} discrepanc${discrepancyCount === 1 ? 'y' : 'ies'}.`,
  });
}

// ─── Read-side queries ────────────────────────────────────────────────────────

/**
 * GET /api/v1/notifications
 * Returns the calling user's notifications, newest first.
 * Optionally filter by `category`.
 */
async function listNotifications({ userId, category } = {}) {
  const where = { userId };
  if (category) where.category = category;

  return prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * GET /api/v1/notifications/unread-count
 */
async function unreadCount(userId) {
  return prisma.notification.count({ where: { userId, isRead: false } });
}

/**
 * PUT /api/v1/notifications/:id/read
 * Marks one notification as read. Validates ownership so users cannot mark
 * other people's notifications.
 */
async function markRead(id, userId) {
  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification) throw { statusCode: 404, message: 'Notification not found', isOperational: true };
  if (notification.userId !== userId) throw { statusCode: 403, message: 'Forbidden', isOperational: true };

  return prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });
}

/**
 * PUT /api/v1/notifications/read-all
 * Marks all of the user's unread notifications as read.
 */
async function markAllRead(userId) {
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
  return { markedCount: result.count };
}

module.exports = {
  createNotification,
  broadcastNotification,
  // convenience wrappers used by other modules
  notifyAssetAllocated,
  notifyAssetReturned,
  notifyTransferRequested,
  notifyTransferApproved,
  notifyTransferRejected,
  notifyBookingCreated,
  notifyBookingCancelled,
  notifyBookingRescheduled,
  notifyMaintenanceRaised,
  notifyMaintenanceApproved,
  notifyMaintenanceRejected,
  notifyMaintenanceResolved,
  notifyAuditDiscrepancy,
  // read-side
  listNotifications,
  unreadCount,
  markRead,
  markAllRead,
};
