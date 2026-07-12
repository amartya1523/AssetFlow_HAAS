const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const { logActivity } = require('./activityLog.service');

const ORGANIZATION_SELECT = {
  id: true,
  name: true,
  slug: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      users: true,
      assets: true,
      departments: true,
      allocations: true,
    },
  },
};

async function listOrganizations({ status, search } = {}) {
  const where = {};
  if (status) where.status = status;
  if (search) {
    const term = search.trim();
    where.OR = [
      { name: { contains: term, mode: 'insensitive' } },
      { slug: { contains: term, mode: 'insensitive' } },
    ];
  }

  return prisma.organization.findMany({
    where,
    select: ORGANIZATION_SELECT,
    orderBy: { createdAt: 'desc' },
  });
}

async function getOrganization(id) {
  const organization = await prisma.organization.findUnique({
    where: { id },
    select: {
      ...ORGANIZATION_SELECT,
      users: {
        select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
        take: 10,
      },
    },
  });

  if (!organization) throw ApiError.notFound('Organization not found');
  return organization;
}

async function updateOrganizationStatus(id, status, actorId = null) {
  const existing = await prisma.organization.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Organization not found');

  const organization = await prisma.organization.update({
    where: { id },
    data: { status },
    select: ORGANIZATION_SELECT,
  });

  await logActivity({
    userId: actorId,
    action: 'PLATFORM_ORGANIZATION_STATUS_CHANGED',
    entityType: 'Organization',
    entityId: id,
    metadata: { from: existing.status, to: status },
  });

  return organization;
}

async function listOrganizationAssets(organizationId, { status, categoryId, departmentId, search } = {}) {
  const organization = await prisma.organization.findUnique({ where: { id: organizationId }, select: { id: true } });
  if (!organization) throw ApiError.notFound('Organization not found');

  const where = { organizationId };
  if (status) where.status = status;
  if (categoryId) where.categoryId = categoryId;
  if (departmentId) where.departmentId = departmentId;
  if (search) {
    const term = search.trim();
    where.OR = [
      { name: { contains: term, mode: 'insensitive' } },
      { assetTag: { contains: term, mode: 'insensitive' } },
      { serialNumber: { contains: term, mode: 'insensitive' } },
    ];
  }

  return prisma.asset.findMany({
    where,
    select: {
      id: true,
      organizationId: true,
      name: true,
      assetTag: true,
      serialNumber: true,
      status: true,
      location: true,
      createdAt: true,
      category: { select: { id: true, name: true } },
      department: { select: { id: true, name: true, code: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

module.exports = {
  listOrganizations,
  getOrganization,
  updateOrganizationStatus,
  listOrganizationAssets,
};
