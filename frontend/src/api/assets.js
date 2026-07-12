import apiClient from './client';

export const assetAPI = {
  list: (params) => apiClient.get('/assets', { params }),
  create: (data) => apiClient.post('/assets', data),
  getById: (id) => apiClient.get(`/assets/${id}`),
  update: (id, data) => apiClient.put(`/assets/${id}`, data),
  history: (id) => apiClient.get(`/assets/${id}/history`),
};
