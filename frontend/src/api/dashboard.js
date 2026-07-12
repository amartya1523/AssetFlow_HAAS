import apiClient from './client';

export const dashboardAPI = {
  overview: (params) => apiClient.get('/dashboard', { params }),
  /** GET /api/v1/dashboard/kpis */
  getKPIs: () => apiClient.get('/dashboard/kpis'),

  /** GET /api/v1/dashboard/recent-activity?limit=20 */
  getRecentActivity: (limit = 20) =>
    apiClient.get('/dashboard/recent-activity', { params: { limit } }),
};

export const notificationAPI = {
  /** GET /api/v1/notifications?category= */
  list: (category) =>
    apiClient.get('/notifications', { params: category ? { category } : undefined }),

  /** GET /api/v1/notifications/unread-count */
  unreadCount: () => apiClient.get('/notifications/unread-count'),

  /** PUT /api/v1/notifications/:id/read */
  markRead: (id) => apiClient.put(`/notifications/${id}/read`),

  /** PUT /api/v1/notifications/read-all */
  markAllRead: () => apiClient.put('/notifications/read-all'),
};
