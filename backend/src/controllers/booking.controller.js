const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendCreated } = require('../utils/apiResponse');
const bookingService = require('../services/booking.service');
const { logActivity } = require('../services/activityLog.service');
const notificationService = require('../services/notification.service');

/**
 * POST /api/v1/bookings
 * Body: { assetId, startTime, endTime }
 * Roles: all authenticated
 */
const createBooking = asyncHandler(async (req, res) => {
  const { assetId, startTime, endTime } = req.body;
  const booking = await bookingService.createBooking({
    assetId,
    bookedById: req.user.userId,
    startTime,
    endTime,
  });

  logActivity({
    userId:     req.user.userId,
    action:     'BOOKING_CREATED',
    entityType: 'Booking',
    entityId:   booking.id,
    metadata:   { assetId, startTime, endTime },
  });
  notificationService.notifyBookingCreated({
    toUserId:  req.user.userId,
    assetName: booking.asset?.name,
    startTime: booking.startTime,
    endTime:   booking.endTime,
  });

  return sendCreated(res, booking);
});

/**
 * GET /api/v1/bookings
 * Query: assetId?, bookedById?, status?
 * Roles: all authenticated
 */
const listBookings = asyncHandler(async (req, res) => {
  const { assetId, bookedById, status } = req.query;
  const bookings = await bookingService.listBookings({
    assetId,
    bookedById,
    status,
  });
  return sendSuccess(res, { data: bookings });
});

/**
 * PUT /api/v1/bookings/:id/cancel
 * Roles: all authenticated (service layer verifies ownership/role)
 */
const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.cancelBooking(
    req.params.id,
    req.user.userId,
    req.user.role
  );

  logActivity({
    userId:     req.user.userId,
    action:     'BOOKING_CANCELLED',
    entityType: 'Booking',
    entityId:   booking.id,
    metadata:   { assetId: booking.assetId },
  });
  notificationService.notifyBookingCancelled({
    toUserId:  booking.bookedById,
    assetName: booking.asset?.name,
  });

  return sendSuccess(res, { data: booking, message: 'Booking cancelled successfully' });
});

/**
 * PUT /api/v1/bookings/:id/reschedule
 * Body: { startTime, endTime }
 * Roles: all authenticated (service layer verifies ownership/role)
 */
const rescheduleBooking = asyncHandler(async (req, res) => {
  const { startTime, endTime } = req.body;
  const booking = await bookingService.rescheduleBooking(
    req.params.id,
    { startTime, endTime },
    req.user.userId,
    req.user.role
  );

  logActivity({
    userId:     req.user.userId,
    action:     'BOOKING_RESCHEDULED',
    entityType: 'Booking',
    entityId:   booking.id,
    metadata:   { assetId: booking.assetId, startTime, endTime },
  });
  notificationService.notifyBookingRescheduled({
    toUserId:  booking.bookedById,
    assetName: booking.asset?.name,
    startTime: booking.startTime,
    endTime:   booking.endTime,
  });

  return sendSuccess(res, { data: booking, message: 'Booking rescheduled successfully' });
});

module.exports = {
  createBooking,
  listBookings,
  cancelBooking,
  rescheduleBooking,
};
