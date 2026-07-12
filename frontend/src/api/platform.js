import apiClient from './client';

export const platformAPI = {
  listOrganizations: (params) => apiClient.get('/platform/organizations', { params }),
  getOrganization: (id) => apiClient.get(`/platform/organizations/${id}`),
  updateOrganizationStatus: (id, status) => apiClient.put(`/platform/organizations/${id}/status`, { status }),
  listOrganizationAssets: (id, params) => apiClient.get(`/platform/organizations/${id}/assets`, { params }),
};
