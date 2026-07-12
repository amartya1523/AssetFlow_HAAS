import apiClient from './client';

export const dashboardAPI = {
  overview: (params) => apiClient.get('/dashboard', { params }),
};
