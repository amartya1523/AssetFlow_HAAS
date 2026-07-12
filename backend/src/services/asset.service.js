const { Prisma } = require('@prisma/client');

const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const { logActivity } = require('./activityLog.service');
const { getDepartmentScope } = require('../utils/permissions');

const ASSET_SELECT = {
  id: true,
  organizationId: true,
  name: true,
  categoryId: true,
  departmentId: true,
  assetTag: true,
  serialNumber: true,
  acquisitionDate: true,
  acquisitionCost: true,
  condition: true,
  location: true,
  photoUrl: true,
  isBookable: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { id: true, name: true, extraFieldsSchema: true } },
  department: { select: { id: true, name: true, code: true } },
};

const STATUS_VALUES = [
  'AVAILABLE',
  'ALLOCATED',
  'RESERVED',
  'UNDER_MAINTENANCE',
  'LOST',
  'RETIRED',
  'DISPOSED',
];

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj || {}, key);
}

function blockStatusPatch(payload) {
  if (hasOwn(payload, 'status')) {
    throw ApiError.badRequest('Asset status is controlled by lifecycle modules and cannot be edited here');
  }
}

function cleanString(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = String(value).trim();
  return trimmed === '' ? null : trimmed;
}

function parseOptionalDate(value, field) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw ApiError.badRequest(`${field} must be a valid date`);
  }
  return date;
}

function parseOptionalDecimal(value, field) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    throw ApiError.badRequest(`${field} must be a non-negative number`);
  }
  return value;
}

function nextAssetTag(latestTag) {
  const match = /^AF-(\d+)$/.exec(latestTag || '');
  const nextNumber = match ? Number(match[1]) + 1 : 1;
  return `AF-${String(nextNumber).padStart(4, '0')}`;
}

function isRetryableTagError(err) {
  return err instanceof Prisma.PrismaClientKnownRequestError &&
    (err.code === 'P2002' || err.code === 'P2034');
}

async function getActor(authUser) {
  if (!authUser) return null;

  if (authUser.role !== 'DEPARTMENT_HEAD') {
    return {
      id: authUser.userId,
      role: authUser.role,
      departmentId: null,
      organizationId: authUser.organizationId || null,
    };
  }

  return prisma.user.findUnique({
    where: { id: authUser.userId },
    select: { id: true, role: true, departmentId: true, organizationId: true },
  });
}

async function assertCategory(organizationId, categoryId) {
  const category = await prisma.assetCategory.findFirst({ where: { id: categoryId, organizationId } });
  if (!category) throw ApiError.badRequest('Referenced asset category does not exist');
  if (category.status !== 'ACTIVE') throw ApiError.badRequest('Referenced asset category is inactive');
}

async function assertDepartment(organizationId, departmentId) {
  if (!departmentId) return;
  const department = await prisma.department.findFirst({ where: { id: departmentId, organizationId } });
  if (!department) throw ApiError.badRequest('Referenced department does not exist');
  if (department.status !== 'ACTIVE') throw ApiError.badRequest('Referenced department is inactive');
}

function buildCreateData(payload) {
  const name = cleanString(payload.name);
  const categoryId = cleanString(payload.categoryId);

  if (!name) throw ApiError.badRequest('Asset name is required');
  if (!categoryId) throw ApiError.badRequest('categoryId is required');

  return {
    name,
    categoryId,
    departmentId: cleanString(payload.departmentId),
    serialNumber: cleanString(payload.serialNumber),
    acquisitionDate: parseOptionalDate(payload.acquisitionDate, 'acquisitionDate'),
    acquisitionCost: parseOptionalDecimal(payload.acquisitionCost, 'acquisitionCost'),
    condition: cleanString(payload.condition),
    location: cleanString(payload.location),
    photoUrl: cleanString(payload.photoUrl),
    isBookable: payload.isBookable === undefined ? false : Boolean(payload.isBookable),
  };
}

function buildUpdateData(payload) {
  const data = {};

  if (hasOwn(payload, 'name')) {
    const name = cleanString(payload.name);
    if (!name) throw ApiError.badRequest('Asset name cannot be empty');
    data.name = name;
  }
  if (hasOwn(payload, 'categoryId')) {
    const categoryId = cleanString(payload.categoryId);
    if (!categoryId) throw ApiError.badRequest('categoryId cannot be empty');
    data.categoryId = categoryId;
  }
  if (hasOwn(payload, 'departmentId')) data.departmentId = cleanString(payload.departmentId);
  if (hasOwn(payload, 'serialNumber')) data.serialNumber = cleanString(payload.serialNumber);
  if (hasOwn(payload, 'acquisitionDate')) data.acquisitionDate = parseOptionalDate(payload.acquisitionDate, 'acquisitionDate');
  if (hasOwn(payload, 'acquisitionCost')) data.acquisitionCost = parseOptionalDecimal(payload.acquisitionCost, 'acquisitionCost');
  if (hasOwn(payload, 'condition')) data.condition = cleanString(payload.condition);
  if (hasOwn(payload, 'location')) data.location = cleanString(payload.location);
  if (hasOwn(payload, 'photoUrl')) data.photoUrl = cleanString(payload.photoUrl);
  if (hasOwn(payload, 'isBookable')) data.isBookable = Boolean(payload.isBookable);

  return data;
}

async function createAsset(payload, authUser = null) {
  const organizationId = authUser?.organizationId;
  if (!organizationId) throw ApiError.forbidden('Organization scope is required');

  blockStatusPatch(payload);
  const data = buildCreateData(payload);

  await assertCategory(organizationId, data.categoryId);
  await assertDepartment(organizationId, data.departmentId);

  let lastError;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      const asset = await prisma.$transaction(async (tx) => {
        const latest = await tx.asset.findFirst({
          where: { organizationId, assetTag: { startsWith: 'AF-' } },
          orderBy: { assetTag: 'desc' },
          select: { assetTag: true },
        });

        return tx.asset.create({
          data: {
            ...data,
            organizationId,
            assetTag: nextAssetTag(latest?.assetTag),
          },
          select: ASSET_SELECT,
        });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

      await logActivity({
        organizationId,
        userId: authUser?.userId || null,
        action: 'ASSET_CREATED',
        entityType: 'Asset',
        entityId: asset.id,
        metadata: { assetTag: asset.assetTag, name: asset.name },
      });

      return asset;
    } catch (err) {
      if (!isRetryableTagError(err)) throw err;
      lastError = err;
    }
  }

  throw lastError || new ApiError(500, 'Unable to generate asset tag');
}

async function listAssets(filters = {}, authUser = null) {
  const actor = await getActor(authUser);
  const scope = getDepartmentScope(actor);
  const where = { organizationId: actor?.organizationId || authUser?.organizationId || null, ...scope };

  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.departmentId && !scope.departmentId) where.departmentId = filters.departmentId;
  if (filters.status) where.status = filters.status;
  if (filters.isBookable !== undefined) where.isBookable = filters.isBookable === 'true' || filters.isBookable === true;

  if (filters.search) {
    const search = filters.search.trim();
    where.OR = [
      { assetTag: { contains: search, mode: 'insensitive' } },
      { serialNumber: { contains: search, mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } },
    ];
  }

  return prisma.asset.findMany({
    where,
    select: ASSET_SELECT,
    orderBy: [{ createdAt: 'desc' }],
  });
}

async function getAssetById(id, authUser = null) {
  const actor = await getActor(authUser);
  const scope = getDepartmentScope(actor);

  const asset = await prisma.asset.findFirst({
    where: { id, organizationId: actor?.organizationId || authUser?.organizationId || null, ...scope },
    select: ASSET_SELECT,
  });

  if (!asset) throw ApiError.notFound('Asset not found');
  return asset;
}

async function updateAsset(id, payload, authUser = null) {
  const organizationId = authUser?.organizationId;
  if (!organizationId) throw ApiError.forbidden('Organization scope is required');

  blockStatusPatch(payload);

  const existing = await prisma.asset.findFirst({ where: { id, organizationId }, select: ASSET_SELECT });
  if (!existing) throw ApiError.notFound('Asset not found');

  const data = buildUpdateData(payload);
  if (data.categoryId) await assertCategory(organizationId, data.categoryId);
  if (hasOwn(data, 'departmentId')) await assertDepartment(organizationId, data.departmentId);

  const updated = await prisma.asset.update({
    where: { id },
    data,
    select: ASSET_SELECT,
  });

  await logActivity({
    organizationId,
    userId: authUser?.userId || null,
    action: 'ASSET_UPDATED',
    entityType: 'Asset',
    entityId: id,
    metadata: { before: existing, after: updated },
  });

  return updated;
}

async function getAssetHistory(id, authUser = null) {
  const asset = await getAssetById(id, authUser);
  const organizationId = asset.organizationId;

  const [activityLogs, allocations, transfers, bookings, maintenanceRequests, auditItems] = await Promise.all([
    prisma.activityLog.findMany({
      where: { organizationId, entityType: 'Asset', entityId: id },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.allocation.findMany({
      where: { organizationId, assetId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        allocatedToUser: { select: { id: true, name: true, email: true } },
        allocatedToDepartment: { select: { id: true, name: true } },
      },
    }),
    prisma.transfer.findMany({
      where: { organizationId, assetId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        fromUser: { select: { id: true, name: true, email: true } },
        toUser: { select: { id: true, name: true, email: true } },
        requestedBy: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.booking.findMany({
      where: { organizationId, assetId: id },
      orderBy: { createdAt: 'desc' },
      include: { bookedBy: { select: { id: true, name: true, email: true } } },
    }),
    prisma.maintenanceRequest.findMany({
      where: { organizationId, assetId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        raisedBy: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.auditItem.findMany({
      where: { organizationId, assetId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        auditCycle: { select: { id: true, name: true, status: true } },
      },
    }),
  ]);

  const timeline = [
    ...activityLogs.map((entry) => ({ type: 'ACTIVITY', occurredAt: entry.createdAt, data: entry })),
    ...allocations.map((entry) => ({ type: 'ALLOCATION', occurredAt: entry.createdAt, data: entry })),
    ...transfers.map((entry) => ({ type: 'TRANSFER', occurredAt: entry.createdAt, data: entry })),
    ...bookings.map((entry) => ({ type: 'BOOKING', occurredAt: entry.createdAt, data: entry })),
    ...maintenanceRequests.map((entry) => ({ type: 'MAINTENANCE', occurredAt: entry.createdAt, data: entry })),
    ...auditItems.map((entry) => ({ type: 'AUDIT', occurredAt: entry.createdAt, data: entry })),
  ].sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt));

  return {
    asset,
    timeline,
    activityLogs,
    allocations,
    transfers,
    bookings,
    maintenanceRequests,
    auditItems,
  };
}

module.exports = {
  STATUS_VALUES,
  createAsset,
  listAssets,
  getAssetById,
  updateAsset,
  getAssetHistory,
};
