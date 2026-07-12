const prisma = require('../config/prisma');

// ─── Dashboard Service ────────────────────────────────────────────────────────

/**
 * GET /api/v1/dashboard/kpis
 *
 * Aggregates all KPI numbers needed by the dashboard in a single DB round-trip
 * using Prisma `$transaction` so all counts are point-in-time consistent.
 *
 * Returns:
 * {
 *   assets: { available, allocated, underMaintenance, total }
 *   activeBookings: number
 *   pendingTransfers: number
 *   upcomingReturns: number    — active allocations with expectedReturnDate in next 7 days
 *   overdueAllocations: number — active allocations past expectedReturnDate
 *   openMaintenanceRequests: number
 *   openAuditCycles: number
 * }
 */
async function getDashboardKPIs() {
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    availableCount,
    allocatedCount,
    underMaintenanceCount,
    totalAssets,
    activeBookings,
    pendingTransfers,
    upcomingReturns,
    overdueAllocations,
    openMaintenanceRequests,
    openAuditCycles,
  ] = await prisma.$transaction([
    prisma.asset.count({ where: { status: 'AVAILABLE' } }),
    prisma.asset.count({ where: { status: 'ALLOCATED' } }),
    prisma.asset.count({ where: { status: 'UNDER_MAINTENANCE' } }),
    prisma.asset.count(),
    // Active bookings: UPCOMING or ONGOING (not cancelled, not completed)
    prisma.booking.count({
      where: {
        status: { in: ['UPCOMING', 'ONGOING'] },
        endTime: { gte: now },
      },
    }),
    prisma.transfer.count({ where: { status: 'REQUESTED' } }),
    // Upcoming returns: active allocations whose expectedReturnDate is within 7 days
    prisma.allocation.count({
      where: {
        status: 'ACTIVE',
        expectedReturnDate: { gte: now, lte: in7Days },
      },
    }),
    // Overdue: active allocations past expectedReturnDate
    prisma.allocation.count({
      where: {
        status: 'ACTIVE',
        expectedReturnDate: { lt: now },
      },
    }),
    prisma.maintenanceRequest.count({
      where: { status: { in: ['PENDING', 'APPROVED', 'TECHNICIAN_ASSIGNED', 'IN_PROGRESS'] } },
    }),
    prisma.auditCycle.count({ where: { status: 'OPEN' } }),
  ]);

  return {
    assets: {
      available:        availableCount,
      allocated:        allocatedCount,
      underMaintenance: underMaintenanceCount,
      total:            totalAssets,
    },
    activeBookings,
    pendingTransfers,
    upcomingReturns,
    overdueAllocations,
    openMaintenanceRequests,
    openAuditCycles,
  };
}

/**
 * GET /api/v1/dashboard/recent-activity
 *
 * Returns the most recent activity log entries for the dashboard feed.
 * Optionally scoped to `limit` (default 20).
 */
async function getRecentActivity({ limit = 20 } = {}) {
  const logs = await prisma.activityLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: Math.min(Number(limit), 100),
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  });
  return logs;
}

module.exports = {
  getDashboardKPIs,
  getRecentActivity,
};
