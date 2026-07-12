import apiClient from './client';

/**
 * Audit API — wraps all /api/v1/audit-cycles and /api/v1/audit-items endpoints
 * from Task 17. Follows the same shape as allocation.js and booking.js.
 */
export const auditAPI = {
  // ── Audit Cycles ───────────────────────────────────────────────
  /** POST /audit-cycles — create a new cycle (auto-generates items) */
  createCycle: (data) => apiClient.post('/audit-cycles', data),

  /** GET /audit-cycles — list all cycles */
  listCycles: () => apiClient.get('/audit-cycles'),

  /** GET /audit-cycles/:id — full cycle with items and progress */
  getCycle: (id) => apiClient.get(`/audit-cycles/${id}`),

  /** GET /audit-cycles/:id/discrepancy-report */
  getDiscrepancyReport: (id) => apiClient.get(`/audit-cycles/${id}/discrepancy-report`),

  /** PUT /audit-cycles/:id/close — irreversible close */
  closeCycle: (id) => apiClient.put(`/audit-cycles/${id}/close`),

  // ── Audit Items ────────────────────────────────────────────────
  /** PUT /audit-items/:id — set result (VERIFIED | MISSING | DAMAGED) + notes */
  updateItem: (id, data) => apiClient.put(`/audit-items/${id}`, data),
};
