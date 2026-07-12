const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

function normalizePagination({ activityPage = 1, activityLimit = 8 } = {}) {
  const page = Math.max(parseInt(activityPage, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(activityLimit, 10) || 8, 1), 50);
  return { page, limit, skip: (page - 1) * limit };
}

function requireOrganizationScope(organizationId) {
  if (!organizationId) {
    throw ApiError.forbidden('Organization scope is required');
  }
}

async function getOverview(organizationId, paginationOptions = {}) {
  requireOrganizationScope(organizationId);

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

async function getDashboardKPIs(organizationId) {
  requireOrganizationScope(organizationId);

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
    prisma.asset.count({ where: { organizationId, status: 'AVAILABLE' } }),
    prisma.asset.count({ where: { organizationId, status: 'ALLOCATED' } }),
    prisma.asset.count({ where: { organizationId, status: 'UNDER_MAINTENANCE' } }),
    prisma.asset.count({ where: { organizationId } }),
    prisma.booking.count({
      where: {
        organizationId,
        status: { in: ['UPCOMING', 'ONGOING'] },
        endTime: { gte: now },
      },
    }),
    prisma.transfer.count({ where: { organizationId, status: 'REQUESTED' } }),
    prisma.allocation.count({
      where: {
        organizationId,
        status: 'ACTIVE',
        expectedReturnDate: { gte: now, lte: in7Days },
      },
    }),
    prisma.allocation.count({
      where: {
        organizationId,
        status: 'ACTIVE',
        expectedReturnDate: { lt: now },
      },
    }),
    prisma.maintenanceRequest.count({
      where: {
        organizationId,
        status: { in: ['PENDING', 'APPROVED', 'TECHNICIAN_ASSIGNED', 'IN_PROGRESS'] },
      },
    }),
    prisma.auditCycle.count({ where: { organizationId, status: 'OPEN' } }),
  ]);

  return {
    assets: {
      available: availableCount,
      allocated: allocatedCount,
      underMaintenance: underMaintenanceCount,
      total: totalAssets,
    },
    activeBookings,
    pendingTransfers,
    upcomingReturns,
    overdueAllocations,
    openMaintenanceRequests,
    openAuditCycles,
  };
}

async function getRecentActivity({ organizationId, limit = 20 } = {}) {
  requireOrganizationScope(organizationId);

  const logs = await prisma.activityLog.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
    take: Math.min(Number(limit) || 20, 100),
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
