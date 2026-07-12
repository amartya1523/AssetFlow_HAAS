import apiClient from './client';

export const allocationAPI = {
  // ── Allocations ────────────────────────────────────────────────
  create: (data) => apiClient.post('/allocations', data),
  list: (params) => apiClient.get('/allocations', { params }),
  getById: (id) => apiClient.get(`/allocations/${id}`),
  returnAsset: (id, data) => apiClient.put(`/allocations/${id}/return`, data),

  // ── Transfers ──────────────────────────────────────────────────
  requestTransfer: (data) => apiClient.post('/transfers', data),
  listTransfers: (params) => apiClient.get('/transfers', { params }),
  getTransferById: (id) => apiClient.get(`/transfers/${id}`),
  approve: (id) => apiClient.put(`/transfers/${id}/approve`),
  reject: (id) => apiClient.put(`/transfers/${id}/reject`),
};
