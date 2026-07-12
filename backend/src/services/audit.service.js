const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const { logActivity } = require('./activityLog.service');

// ─── Audit Service ────────────────────────────────────────────────────────────

/**
 * POST /api/v1/audit-cycles
 *
 * Create an audit cycle and auto-generate one AuditItem per in-scope asset.
 * Scope is optional: if scopeDepartmentId or scopeLocation is provided, only
 * assets matching that scope are included; otherwise every asset is included.
 *
 * Each AuditItem copies the asset's current `location` into `expectedLocation`
 * as a snapshot — this is the baseline the auditor will verify against.
 *
 * Auditors (array of userId strings) are attached as AuditCycleAuditor rows.
 *
 * All DB writes happen in a single transaction.
 */
async function createCycle({
  name,
  scopeDepartmentId,
  scopeLocation,
  startDate,
  endDate,
  auditorIds,
  createdById,
}) {
  // ── 1. Validate dates ────────────────────────────────────────────────────
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw ApiError.badRequest('startDate and endDate must be valid ISO 8601 dates');
  }
  if (end <= start) {
    throw ApiError.badRequest('endDate must be after startDate');
  }

  // ── 2. Validate auditors exist ───────────────────────────────────────────
  const uniqueAuditorIds = [...new Set(auditorIds ?? [])];
  if (uniqueAuditorIds.length > 0) {
    const users = await prisma.user.findMany({
      where: { id: { in: uniqueAuditorIds } },
      select: { id: true },
    });
    if (users.length !== uniqueAuditorIds.length) {
      throw ApiError.badRequest('One or more auditor user IDs are invalid');
    }
  }

  // ── 3. Fetch in-scope assets ─────────────────────────────────────────────
  const assetWhere = {};
  if (scopeDepartmentId) assetWhere.departmentId = scopeDepartmentId;
  if (scopeLocation)     assetWhere.location = scopeLocation;

  const assets = await prisma.asset.findMany({
    where: assetWhere,
    select: { id: true, location: true },
  });

  // ── 4. Build transactional writes ────────────────────────────────────────
  const cycle = await prisma.$transaction(async (tx) => {
    // 4a. Create the cycle
    const created = await tx.auditCycle.create({
      data: {
        name,
        scopeDepartmentId: scopeDepartmentId ?? null,
        scopeLocation:     scopeLocation     ?? null,
        startDate:         start,
        endDate:           end,
        status:            'OPEN',
        createdById,
        // Auditors
        auditors: uniqueAuditorIds.length > 0
          ? {
              create: uniqueAuditorIds.map((auditorId) => ({ auditorId })),
            }
          : undefined,
        // Auto-generate one AuditItem per scoped asset
        items: assets.length > 0
          ? {
              create: assets.map((asset) => ({
                assetId:          asset.id,
                expectedLocation: asset.location ?? null,
                result:           null,
                notes:            null,
              })),
            }
          : undefined,
      },
      include: _cycleInclude,
    });

    return created;
  });

  await logActivity({
    userId:     createdById,
    action:     'AUDIT_CYCLE_CREATED',
    entityType: 'AuditCycle',
    entityId:   cycle.id,
    metadata:   { name, scopeDepartmentId, scopeLocation, itemCount: assets.length },
  });

  return cycle;
}

/**
 * GET /api/v1/audit-cycles/:id
 * Return the cycle with its auditors and all audit items (with asset detail).
 */
async function getCycleById(id) {
  const cycle = await prisma.auditCycle.findUnique({
    where:   { id },
    include: _cycleInclude,
  });

  if (!cycle) throw ApiError.notFound('Audit cycle not found');
  return _withProgress(cycle);
}

/**
 * GET /api/v1/audit-cycles
 * List all audit cycles (for the listing page).
 */
async function listCycles() {
  const cycles = await prisma.auditCycle.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      scopeDepartment: { select: { id: true, name: true } },
      createdBy:       { select: { id: true, name: true, email: true } },
      auditors: {
        include: { auditor: { select: { id: true, name: true, email: true } } },
      },
      _count: { select: { items: true } },
    },
  });
  return cycles;
}

/**
 * PUT /api/v1/audit-items/:id
 *
 * Update an audit item's result (VERIFIED | MISSING | DAMAGED) and optional notes.
 * Blocked if the parent cycle is CLOSED.
 */
async function updateAuditItem(itemId, { result, notes }) {
  // ── 1. Fetch item with its cycle ─────────────────────────────────────────
  const item = await prisma.auditItem.findUnique({
    where:   { id: itemId },
    include: { auditCycle: { select: { id: true, status: true } } },
  });

  if (!item) throw ApiError.notFound('Audit item not found');

  // ── 2. Block edits on closed cycles ──────────────────────────────────────
  if (item.auditCycle.status === 'CLOSED') {
    throw ApiError.badRequest('Cannot update items belonging to a closed audit cycle');
  }

  // ── 3. Validate result enum ───────────────────────────────────────────────
  const validResults = ['VERIFIED', 'MISSING', 'DAMAGED'];
  if (result !== undefined && result !== null && !validResults.includes(result)) {
    throw ApiError.badRequest(`result must be one of: ${validResults.join(', ')}`);
  }

  // ── 4. Persist ───────────────────────────────────────────────────────────
  const updated = await prisma.auditItem.update({
    where: { id: itemId },
    data: {
      result: result ?? undefined,
      notes:  notes  ?? undefined,
    },
    include: {
      asset:      { select: { id: true, assetTag: true, name: true, location: true, status: true } },
      auditCycle: { select: { id: true, name: true, status: true } },
    },
  });

  return updated;
}

/**
 * GET /api/v1/audit-cycles/:id/discrepancy-report
 *
 * Returns only the audit items that are NOT verified:
 * - items with result = MISSING or DAMAGED
 * - items with result = null (not yet checked)
 *
 * Per task spec: "Discrepancy report only includes non-verified items."
 */
async function getDiscrepancyReport(cycleId) {
  const cycle = await prisma.auditCycle.findUnique({
    where:  { id: cycleId },
    select: { id: true, name: true, status: true, startDate: true, endDate: true },
  });

  if (!cycle) throw ApiError.notFound('Audit cycle not found');

  const discrepancies = await prisma.auditItem.findMany({
    where: {
      auditCycleId: cycleId,
      NOT: { result: 'VERIFIED' },  // includes null, MISSING, DAMAGED
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      asset: {
        select: {
          id:           true,
          assetTag:     true,
          name:         true,
          location:     true,
          status:       true,
          department:   { select: { id: true, name: true } },
        },
      },
    },
  });

  return {
    cycle,
    discrepancyCount: discrepancies.length,
    discrepancies,
  };
}

/**
 * PUT /api/v1/audit-cycles/:id/close
 *
 * Closes the cycle. Business rules:
 * - Cycle must be OPEN.
 * - All items with result = null (unverified, not touched) are treated as MISSING.
 * - Sets cycle.status = CLOSED.
 * - All mutations happen in one transaction for consistency.
 */
async function closeCycle(cycleId, closedById) {
  // ── 1. Verify cycle exists and is open ───────────────────────────────────
  const cycle = await prisma.auditCycle.findUnique({
    where:   { id: cycleId },
    include: { items: true },
  });

  if (!cycle) throw ApiError.notFound('Audit cycle not found');

  if (cycle.status === 'CLOSED') {
    throw ApiError.badRequest('Audit cycle is already closed');
  }

  // ── 2. Identify unresolved items (result still null) ─────────────────────
  const unresolvedIds = cycle.items
    .filter((item) => item.result === null)
    .map((item) => item.id);

  // ── 3. Transaction: mark unresolved as MISSING, close cycle ──────────────
  const [, closed] = await prisma.$transaction([
    // Mark all null-result items as MISSING
    unresolvedIds.length > 0
      ? prisma.auditItem.updateMany({
          where: { id: { in: unresolvedIds } },
          data:  { result: 'MISSING' },
        })
      : prisma.auditItem.findMany({ where: { id: '00000000-0000-0000-0000-000000000000' }, take: 0 }),

    // Close the cycle
    prisma.auditCycle.update({
      where:   { id: cycleId },
      data:    { status: 'CLOSED' },
      include: _cycleInclude,
    }),
  ]);

  await logActivity({
    userId:     closedById,
    action:     'AUDIT_CYCLE_CLOSED',
    entityType: 'AuditCycle',
    entityId:   cycleId,
    metadata:   { markedMissingCount: unresolvedIds.length },
  });

  return _withProgress(closed);
}

// ─── Private helpers ──────────────────────────────────────────────────────────

/**
 * Standard Prisma include for a full AuditCycle response.
 */
const _cycleInclude = {
  scopeDepartment: { select: { id: true, name: true } },
  createdBy:       { select: { id: true, name: true, email: true } },
  auditors: {
    include: {
      auditor: { select: { id: true, name: true, email: true } },
    },
  },
  items: {
    orderBy: { createdAt: 'asc' },
    include: {
      asset: {
        select: {
          id:           true,
          assetTag:     true,
          name:         true,
          location:     true,
          status:       true,
          department:   { select: { id: true, name: true } },
        },
      },
    },
  },
};

/**
 * Attach computed progress fields to a cycle object:
 *   totalItems, verifiedCount, discrepancyCount, progressPercent
 */
function _withProgress(cycle) {
  if (!cycle || !cycle.items) return cycle;
  const total      = cycle.items.length;
  const verified   = cycle.items.filter((i) => i.result === 'VERIFIED').length;
  const discrepancy = cycle.items.filter(
    (i) => i.result === 'MISSING' || i.result === 'DAMAGED',
  ).length;
  const pending    = cycle.items.filter((i) => i.result === null).length;

  return {
    ...cycle,
    progress: {
      totalItems:       total,
      verifiedCount:    verified,
      discrepancyCount: discrepancy,
      pendingCount:     pending,
      progressPercent:  total > 0 ? Math.round(((verified + discrepancy) / total) * 100) : 0,
    },
  };
}

module.exports = {
  createCycle,
  getCycleById,
  listCycles,
  updateAuditItem,
  getDiscrepancyReport,
  closeCycle,
};
