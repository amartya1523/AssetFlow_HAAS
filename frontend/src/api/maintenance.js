import apiClient from './client';

export const maintenanceAPI = {
  // GET /api/v1/maintenance
  list: (params) => apiClient.get('/maintenance', { params }),

  // POST /api/v1/maintenance
  create: (data) => apiClient.post('/maintenance', data),

  // PUT /api/v1/maintenance/:id/approve
  approve: (id) => apiClient.put(`/maintenance/${id}/approve`),

  // PUT /api/v1/maintenance/:id/reject
  reject: (id, data) => apiClient.put(`/maintenance/${id}/reject`, data),

  // PUT /api/v1/maintenance/:id/assign-technician
  assignTechnician: (id, data) => apiClient.put(`/maintenance/${id}/assign-technician`, data),

  // PUT /api/v1/maintenance/:id/start
  start: (id) => apiClient.put(`/maintenance/${id}/start`),

  // PUT /api/v1/maintenance/:id/resolve
  resolve: (id) => apiClient.put(`/maintenance/${id}/resolve`),
};
