import apiClient from './client';

export const usersAPI = {
  list: (params) => apiClient.get('/users', { params }),
  create: (data) => apiClient.post('/users', data),
  update: (id, data) => apiClient.put(`/users/${id}`, data),
  getPermissions: (id) => apiClient.get(`/users/${id}/permissions`),
  updatePermissions: (id, overrides) => apiClient.put(`/users/${id}/permissions`, { overrides }),
};
