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

module.exports = { getOverview };
