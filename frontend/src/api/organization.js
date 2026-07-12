import apiClient from './client';

export const orgAPI = {
  // Departments
  listDepartments: () => apiClient.get('/departments'),
  createDepartment: (data) => apiClient.post('/departments', data),
  updateDepartment: (id, data) => apiClient.put(`/departments/${id}`, data),
  deleteDepartment: (id) => apiClient.delete(`/departments/${id}`),

  // Categories
  listCategories: () => apiClient.get('/categories'),
  createCategory: (data) => apiClient.post('/categories', data),
  updateCategory: (id, data) => apiClient.put(`/categories/${id}`, data),
  deleteCategory: (id) => apiClient.delete(`/categories/${id}`),

  // Employees
  listEmployees: (params) => apiClient.get('/employees', { params }),
  updateEmployeeRole: (id, role) => apiClient.put(`/employees/${id}/role`, { role }),
};
