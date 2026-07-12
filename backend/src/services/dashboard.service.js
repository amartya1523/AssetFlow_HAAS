const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

function normalizePagination({ activityPage = 1, activityLimit = 8 } = {}) {
  const page = Math.max(parseInt(activityPage, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(activityLimit, 10) || 8, 1), 50);
  return { page, limit, skip: (page - 1) * limit };
}

async function getOverview(organizationId, paginationOptions = {}) {
  if (!organizationId) {
    throw ApiError.forbidden('Organization scope is required');
  }

  const { page, limit, skip } = normalizePagination(paginationOptions);
  const [
    totalAssets,
    activeAllocations,
    pendingRequests,
    maintenanceDue,
    activityTotal,
    recentActivity,
  ] = await Promise.all([
    prisma.asset.count({ where: { organizationId } }),
    prisma.allocation.count({ where: { organizationId, status: 'ACTIVE' } }),
    prisma.transfer.count({ where: { organizationId, status: 'REQUESTED' } }),
    prisma.maintenanceRequest.count({
      where: {
        organizationId,
        status: { in: ['PENDING', 'APPROVED', 'TECHNICIAN_ASSIGNED', 'IN_PROGRESS'] },
      },
    }),
    prisma.activityLog.count({ where: { organizationId } }),
    prisma.activityLog.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  return {
    stats: {
      totalAssets,
      activeAllocations,
      pendingRequests,
      maintenanceDue,
    },
    recentActivity,
    activityPagination: {
      page,
      limit,
      total: activityTotal,
      totalPages: Math.max(Math.ceil(activityTotal / limit), 1),
      hasNextPage: page * limit < activityTotal,
      hasPrevPage: page > 1,
    },
  };
}



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
  getOverview,
  getDashboardKPIs,
  getRecentActivity,
};
