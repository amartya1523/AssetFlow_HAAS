const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

function requireOrganizationScope(organizationId) {
  if (!organizationId) {
    throw ApiError.forbidden('Organization scope is required');
  }
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(date) {
  return date.toLocaleString('en-IN', { month: 'short' });
}

function humanizeStatus(value) {
  return String(value || '')
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function daysBetween(from, to = new Date()) {
  const diff = to.getTime() - from.getTime();
  return Math.max(Math.floor(diff / (1000 * 60 * 60 * 24)), 0);
}

function buildCsv(summary) {
  const lines = [];

  lines.push('AssetFlow Reports Export');
  lines.push(`Generated At,${summary.generatedAt}`);

  lines.push('');
  lines.push('UTILIZATION BY DEPARTMENT');
  lines.push('Department,Allocated Assets,Total Assets,Utilization Rate');
  summary.deptUtil.forEach((item) => {
    lines.push(`"${item.name}",${item.allocated},${item.total},${item.rate}%`);
  });

  lines.push('');
  lines.push('MAINTENANCE FREQUENCY');
  lines.push('Month,Requests');
  summary.maintFreq.forEach((item) => {
    lines.push(`"${item.month}",${item.count}`);
  });

  lines.push('');
  lines.push('MOST USED ASSETS');
  lines.push('Asset Tag,Asset Name,Category,Usage Count');
  summary.mostUsed.forEach((item) => {
    lines.push(`"${item.tag}","${item.name}","${item.type}",${item.usageCount}`);
  });

  lines.push('');
  lines.push('IDLE ASSETS');
  lines.push('Asset Tag,Asset Name,Category,Idle Days');
  summary.idleAssets.forEach((item) => {
    lines.push(`"${item.tag}","${item.name}","${item.type}",${item.idleDays}`);
  });

  lines.push('');
  lines.push('MAINTENANCE AND RETIREMENT');
  lines.push('Asset Tag,Asset Name,Status');
  summary.dueMaint.forEach((item) => {
    lines.push(`"${item.tag}","${item.name}","${item.status}"`);
  });

  return `${lines.join('\n')}\n`;
}

async function getSummary(organizationId) {
  requireOrganizationScope(organizationId);

  const sixMonths = [];
  const now = new Date();
  for (let offset = 5; offset >= 0; offset -= 1) {
    sixMonths.push(new Date(now.getFullYear(), now.getMonth() - offset, 1));
  }

  const [departments, assets, allocations, bookings, maintenanceRequests] = await Promise.all([
    prisma.department.findMany({
      where: { organizationId, status: 'ACTIVE' },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.asset.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        assetTag: true,
        status: true,
        departmentId: true,
        createdAt: true,
        updatedAt: true,
        category: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.allocation.findMany({
      where: { organizationId },
      select: {
        id: true,
        assetId: true,
        allocatedAt: true,
        actualReturnDate: true,
        status: true,
      },
    }),
    prisma.booking.findMany({
      where: { organizationId },
      select: {
        id: true,
        assetId: true,
        startTime: true,
        endTime: true,
        createdAt: true,
        status: true,
      },
    }),
    prisma.maintenanceRequest.findMany({
      where: { organizationId },
      select: {
        id: true,
        assetId: true,
        status: true,
        createdAt: true,
        resolvedAt: true,
        asset: {
          select: {
            id: true,
            name: true,
            assetTag: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const deptLookup = new Map(departments.map((department) => [department.id, department.name]));
  const deptStats = new Map();

  departments.forEach((department) => {
    deptStats.set(department.name, { name: department.name, allocated: 0, total: 0, rate: 0 });
  });

  assets.forEach((asset) => {
    const deptName = deptLookup.get(asset.departmentId) || 'Unassigned';
    if (!deptStats.has(deptName)) {
      deptStats.set(deptName, { name: deptName, allocated: 0, total: 0, rate: 0 });
    }

    const stat = deptStats.get(deptName);
    stat.total += 1;
    if (asset.status === 'ALLOCATED') {
      stat.allocated += 1;
    }
  });

  const deptUtil = Array.from(deptStats.values())
    .filter((item) => item.total > 0)
    .map((item) => ({
      ...item,
      rate: Math.round((item.allocated / item.total) * 100),
    }))
    .sort((left, right) => right.rate - left.rate || left.name.localeCompare(right.name))
    .slice(0, 6);

  const maintenanceBuckets = new Map(
    sixMonths.map((date) => [
      monthKey(date),
      { month: monthLabel(date), count: 0 },
    ]),
  );

  maintenanceRequests.forEach((request) => {
    const key = monthKey(new Date(request.createdAt));
    if (maintenanceBuckets.has(key)) {
      maintenanceBuckets.get(key).count += 1;
    }
  });

  const maintFreq = sixMonths.map((date) => maintenanceBuckets.get(monthKey(date)));

  const assetLookup = new Map(assets.map((asset) => [asset.id, asset]));
  const usageMap = new Map();
  const lastUsageMap = new Map();

  allocations.forEach((allocation) => {
    usageMap.set(allocation.assetId, (usageMap.get(allocation.assetId) || 0) + 1);
    const candidates = [allocation.allocatedAt, allocation.actualReturnDate].filter(Boolean);
    candidates.forEach((candidate) => {
      const current = lastUsageMap.get(allocation.assetId);
      if (!current || new Date(candidate) > current) {
        lastUsageMap.set(allocation.assetId, new Date(candidate));
      }
    });
  });

  bookings.forEach((booking) => {
    usageMap.set(booking.assetId, (usageMap.get(booking.assetId) || 0) + 1);
    const candidates = [booking.endTime, booking.startTime, booking.createdAt].filter(Boolean);
    candidates.forEach((candidate) => {
      const current = lastUsageMap.get(booking.assetId);
      if (!current || new Date(candidate) > current) {
        lastUsageMap.set(booking.assetId, new Date(candidate));
      }
    });
  });

  const mostUsed = Array.from(usageMap.entries())
    .map(([assetId, usageCount]) => {
      const asset = assetLookup.get(assetId);
      if (!asset) return null;
      return {
        id: asset.id,
        name: asset.name,
        tag: asset.assetTag,
        type: asset.category?.name || 'Asset',
        usageCount,
      };
    })
    .filter(Boolean)
    .sort((left, right) => right.usageCount - left.usageCount || left.name.localeCompare(right.name))
    .slice(0, 5);

  const idleAssets = assets
    .map((asset) => {
      const lastUsedAt = lastUsageMap.get(asset.id) || new Date(asset.createdAt);
      return {
        id: asset.id,
        name: asset.name,
        tag: asset.assetTag,
        type: asset.category?.name || 'Asset',
        idleDays: daysBetween(lastUsedAt),
      };
    })
    .sort((left, right) => right.idleDays - left.idleDays || left.name.localeCompare(right.name))
    .slice(0, 5);

  const dueMaint = maintenanceRequests
    .filter((request) => !['RESOLVED', 'REJECTED'].includes(request.status))
    .map((request) => ({
      id: request.id,
      name: request.asset?.name || 'Asset',
      tag: request.asset?.assetTag || 'N/A',
      status: humanizeStatus(request.status),
    }))
    .slice(0, 5);

  return {
    generatedAt: new Date().toISOString(),
    deptUtil,
    maintFreq,
    mostUsed,
    idleAssets,
    dueMaint,
  };
}

async function exportSummary(organizationId) {
  const summary = await getSummary(organizationId);
  return buildCsv(summary);
}

module.exports = {
  getSummary,
  exportSummary,
};
