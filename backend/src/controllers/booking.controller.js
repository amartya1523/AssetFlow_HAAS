const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendCreated } = require('../utils/apiResponse');
const bookingService = require('../services/booking.service');

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
  return sendSuccess(res, { data: booking, message: 'Booking rescheduled successfully' });
});

module.exports = {
  createBooking,
  listBookings,
  cancelBooking,
  rescheduleBooking,
};
