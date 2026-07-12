import apiClient from './client';

export const bookingAPI = {
  // GET /api/v1/bookings
  list: (params) => apiClient.get('/bookings', { params }),

  // POST /api/v1/bookings
  create: (data) => apiClient.post('/bookings', data),

  // PUT /api/v1/bookings/:id/cancel
  cancel: (id) => apiClient.put(`/bookings/${id}/cancel`),

  // PUT /api/v1/bookings/:id/reschedule
  reschedule: (id, data) => apiClient.put(`/bookings/${id}/reschedule`, data),
};
