const prisma = require('../config/prisma');

/**
 * Centralized activity logging.
 *
 * Every auditable action across modules flows through `logActivity` so the
 * write shape stays consistent and there is a single place for Task 19 to
 * extend (event bus, async queue, etc.) without touching call sites.
 *
 * Logging is best-effort: it must never break the caller's request. A failure
 * to record a log entry is logged to console and swallowed.
 */

/**
 * Record an activity log entry.
 *
 * @param {object} entry
 * @param {string} [entry.organizationId] - tenant organization id
 * @param {string} [entry.userId] - the user performing the action (null for system)
 * @param {string} entry.action   - canonical action key, e.g. 'DEPARTMENT_CREATED'
 * @param {string} entry.entityType - e.g. 'Department', 'User'
 * @param {string} [entry.entityId] - id of the affected entity
 * @param {object} [entry.metadata] - arbitrary JSON context (before/after, etc.)
 * @returns {Promise<void>}
 */
async function logActivity({
  organizationId = null,
  userId = null,
  action,
  entityType,
  entityId = null,
  metadata = null,
}) {
  try {
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId,
        action,
        entityType,
        entityId,
        metadata,
      },
    });
  } catch (err) {
    // Never let audit logging crash the request.
    // eslint-disable-next-line no-console
    console.error(`[ACTIVITY_LOG] failed to record "${action}":`, err.message);
  }
}

module.exports = { logActivity };
