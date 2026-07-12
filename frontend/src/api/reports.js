import apiClient from './client';

export const reportsAPI = {
  summary: () => apiClient.get('/reports/summary'),
  exportCsv: () =>
    apiClient.get('/reports/export', {
      responseType: 'blob',
    }),
};
