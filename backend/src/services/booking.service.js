const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function requireOrganization(authUser) {
  const organizationId = authUser?.organizationId;
  if (!organizationId) {
    throw ApiError.forbidden('Organization scope is required');
  }
  return organizationId;
}

/**
 * Derive the current status of a booking based on time.
 * If cancelled, it remains CANCELLED.
 * Otherwise: UPCOMING (future), ONGOING (current), COMPLETED (past).
 */
function withStatus(booking) {
  if (!booking) return null;
  if (booking.status === 'CANCELLED') return booking;

  const now = new Date();
  let derivedStatus = 'UPCOMING';

  if (now > booking.endTime) {
    derivedStatus = 'COMPLETED';
  } else if (now >= booking.startTime && now <= booking.endTime) {
    derivedStatus = 'ONGOING';
  }

  return { ...booking, status: derivedStatus };
}

/**
 * Check for overlapping bookings.
 * Overlap logic: newStart < existingEnd && newEnd > existingStart
 */
async function checkOverlap(organizationId, assetId, start, end, excludeBookingId = null) {
  const whereClause = {
    organizationId,
    assetId,
    status: { not: 'CANCELLED' },
    AND: [
      { startTime: { lt: end } },
      { endTime: { gt: start } }
    ]
  };

  if (excludeBookingId) {
    whereClause.id = { not: excludeBookingId };
  }

  const conflict = await prisma.booking.findFirst({
    where: whereClause,
    include: {
      bookedBy: { select: { id: true, name: true, email: true } },
    }
  });

  return conflict;
}

// ─── Booking Service ─────────────────────────────────────────────────────────

/**
 * Create a new booking for an asset.
 * 
 * Rules:
 * 1. Asset must exist and be bookable.
 * 2. startTime must be before endTime.
 * 3. Cannot overlap with existing non-cancelled bookings.
 */
async function createBooking({ assetId, bookedById, startTime, endTime }, authUser) {
  const organizationId = requireOrganization(authUser);
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (start >= end) {
    throw ApiError.badRequest('startTime must be before endTime');
  }

  // 1. Fetch asset
  const asset = await prisma.asset.findFirst({
    where: { id: assetId, organizationId }
  });

  if (!asset) {
    throw ApiError.notFound('Asset not found');
  }

  if (!asset.isBookable) {
    throw new ApiError(400, 'Asset is not available for booking');
  }

  // 2. Check for overlaps
  const conflict = await checkOverlap(organizationId, assetId, start, end);
  if (conflict) {
    throw new ApiError(409, 'Time slot overlaps with an existing booking', [
      {
        field: 'timeSlot',
        message: 'Time slot overlaps with an existing booking',
        conflict: {
          bookingId: conflict.id,
          bookedBy: conflict.bookedBy,
          startTime: conflict.startTime,
          endTime: conflict.endTime,
        },
      }
    ]);
  }

  // 3. Create booking
  const booking = await prisma.booking.create({
    data: {
      organizationId,
      assetId,
      bookedById,
      startTime: start,
      endTime: end,
      status: 'UPCOMING',
    },
    include: {
      asset: { select: { id: true, assetTag: true, name: true } },
      bookedBy: { select: { id: true, name: true, email: true } },
    }
  });

  return withStatus(booking);
}

/**
 * List bookings with optional filters.
 * Enriches each record with derived status.
 */
async function listBookings({ assetId, bookedById, status } = {}, authUser) {
  const organizationId = requireOrganization(authUser);
  const where = { organizationId };
  if (assetId) where.assetId = assetId;
  if (bookedById) where.bookedById = bookedById;
  
  // Note: if status filter is provided, we still fetch all (or those not cancelled) 
  // and filter post-derivation, unless it's CANCELLED which is stored.
  if (status === 'CANCELLED') {
    where.status = 'CANCELLED';
  }

  const bookings = await prisma.booking.findMany({
    where,
    orderBy: { startTime: 'asc' },
    include: {
      asset: { select: { id: true, assetTag: true, name: true, isBookable: true } },
      bookedBy: { select: { id: true, name: true, email: true } },
    }
  });

  const enriched = bookings.map(withStatus);

  if (status && status !== 'CANCELLED') {
    return enriched.filter(b => b.status === status);
  }

  return enriched;
}

/**
 * Cancel a booking.
 */
async function cancelBooking(id, userId, userRole, authUser) {
  const organizationId = requireOrganization(authUser);
  const booking = await prisma.booking.findFirst({
    where: { id, organizationId }
  });

  if (!booking) {
    throw ApiError.notFound('Booking not found');
  }

  if (booking.status === 'CANCELLED') {
    throw ApiError.badRequest('Booking is already cancelled');
  }

  // Only the person who booked it, or an admin/manager can cancel it
  const isOwner = booking.bookedById === userId;
  const canManage = ['ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'].includes(userRole);
  
  if (!isOwner && !canManage) {
    throw ApiError.forbidden('You do not have permission to cancel this booking');
  }

  const cancelled = await prisma.booking.update({
    where: { id },
    data: { status: 'CANCELLED' },
    include: {
      asset: { select: { id: true, assetTag: true, name: true } },
      bookedBy: { select: { id: true, name: true, email: true } },
    }
  });

  return withStatus(cancelled);
}

/**
 * Reschedule a booking.
 */
async function rescheduleBooking(id, { startTime, endTime }, userId, userRole, authUser) {
  const organizationId = requireOrganization(authUser);
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (start >= end) {
    throw ApiError.badRequest('startTime must be before endTime');
  }

  const booking = await prisma.booking.findFirst({
    where: { id, organizationId }
  });

  if (!booking) {
    throw ApiError.notFound('Booking not found');
  }

  if (booking.status === 'CANCELLED') {
    throw ApiError.badRequest('Cannot reschedule a cancelled booking');
  }

  // Only owner or admin/manager
  const isOwner = booking.bookedById === userId;
  const canManage = ['ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'].includes(userRole);
  
  if (!isOwner && !canManage) {
    throw ApiError.forbidden('You do not have permission to reschedule this booking');
  }

  // Check for overlaps excluding the current booking
  const conflict = await checkOverlap(organizationId, booking.assetId, start, end, id);
  if (conflict) {
    throw new ApiError(409, 'Time slot overlaps with an existing booking', [
      {
        field: 'timeSlot',
        message: 'Time slot overlaps with an existing booking',
        conflict: {
          bookingId: conflict.id,
          bookedBy: conflict.bookedBy,
          startTime: conflict.startTime,
          endTime: conflict.endTime,
        },
      }
    ]);
  }

  const rescheduled = await prisma.booking.update({
    where: { id },
    data: {
      startTime: start,
      endTime: end,
    },
    include: {
      asset: { select: { id: true, assetTag: true, name: true } },
      bookedBy: { select: { id: true, name: true, email: true } },
    }
  });

  return withStatus(rescheduled);
}

module.exports = {
  createBooking,
  listBookings,
  cancelBooking,
  rescheduleBooking,
};
