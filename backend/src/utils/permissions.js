const ApiError = require('./ApiError');

/**
 * Role-Based Access Control toolkit.
 *
 * Task 6 builds on top of the `authenticate` and `authorize` middleware that
 * already live in `src/middleware/auth.js`. Those two handle JWT verification
 * and role-list checks; this module provides the supporting layer they depend
 * on for the rest of the product:
 *
 *   - a canonical universe of every action in the system (MODULE_ACTIONS)
 *   - a single source of truth for which role can perform which action
 *     (ROLE_PERMISSIONS)
 *   - a derived permissions matrix (action -> roles[]) that never drifts
 *   - a `can()` helper for service-layer checks
 *   - a `requirePermission()` middleware that reads the matrix so routes can
 *     be guarded by intent ("organization:manage") instead of hardcoded role
 *     lists ("authorize('ADMIN')")
 *   - a `getDepartmentScope()` helper so Department Heads only ever see the
 *     data of their own department
 *
 * The middleware intentionally reuses the exact same error messages as the
 * existing `authorize` guard ("Authentication required" / "Insufficient
 * permissions") so clients cannot tell the two apart and the error contract
 * stays uniform.
 */

// ─── Roles ──────────────────────────────────────────────────────────────────

/**
 * Canonical roles. Matches the `UserRole` Prisma enum exactly — do not rename
 * (AI Agent Sync Rule).
 */
const ROLES = Object.freeze({
  EMPLOYEE: 'EMPLOYEE',
  DEPARTMENT_HEAD: 'DEPARTMENT_HEAD',
  ASSET_MANAGER: 'ASSET_MANAGER',
  ADMIN: 'ADMIN',
});

const ALL_ROLES = Object.freeze(Object.values(ROLES));

/**
 * Wildcard meaning "every action in the system". Reserved for ADMIN so new
 * actions are automatically covered without editing the matrix each time.
 */
const WILDCARD = '*';

// ─── Canonical action universe ──────────────────────────────────────────────
//
// The complete inventory of actions across every product module. This is the
// authoritative list: ALL_ACTIONS and PERMISSIONS are derived from it, which
// is what makes the "permissions map covers every action from all product
// modules" acceptance criterion literally verifiable.
//
// Module namespaces mirror the recommended architecture: auth, organization,
// assets, allocation, booking, maintenance, audit, notifications, dashboard,
// reports. (employees:* is namespaced separately but belongs to the Task 7
// Organization module together with organization:*.)
//
// Note: there is intentionally NO `assets:status` action. Per Task 9, asset
// status mutations are owned exclusively by the lifecycle modules
// (allocation / booking / maintenance / audit) and may never be edited
// directly from the asset endpoints.

const MODULE_ACTIONS = Object.freeze({
  auth: [
    'auth:read-self',
    'auth:reset-password',
  ],
  organization: [
    'organization:read',
    'organization:manage',
    'employees:read',
    'employees:update-role',
  ],
  assets: [
    'assets:create',
    'assets:read',
    'assets:update',
    'assets:delete',
    'assets:read-history',
  ],
  allocation: [
    'allocation:create',
    'allocation:read',
    'allocation:manage',
    'transfer:create',
    'transfer:read',
    'transfer:approve',
  ],
  booking: [
    'booking:create',
    'booking:read',
    'booking:cancel',
  ],
  maintenance: [
    'maintenance:raise',
    'maintenance:read',
    'maintenance:approve',
    'maintenance:assign-technician',
    'maintenance:resolve',
    'maintenance:reject',
  ],
  audit: [
    'audit:create-cycle',
    'audit:assign-auditors',
    'audit:record-result',
    'audit:close-cycle',
    'audit:read',
  ],
  notifications: [
    'notifications:read',
    'notifications:mark-read',
  ],
  dashboard: [
    'dashboard:view',
  ],
  reports: [
    'reports:view',
    'reports:export',
  ],
});

/**
 * Flat, sorted list of every action in the system.
 */
const ALL_ACTIONS = Object.freeze(
  Object.values(MODULE_ACTIONS).flat().sort(),
);

// ─── Source of truth: role -> actions ───────────────────────────────────────
//
// This is the only place permission grants are declared. PERMISSIONS (the
// matrix), `can`, and `requirePermission` are derived from it + ALL_ACTIONS
// so the views can never drift.

const ROLE_PERMISSIONS = Object.freeze({
  [ROLES.ADMIN]: [WILDCARD],

  [ROLES.ASSET_MANAGER]: [
    // organization (read-only; master data is admin-managed)
    'organization:read',
    'employees:read',
    // assets — full lifecycle except master data
    'assets:create',
    'assets:read',
    'assets:update',
    'assets:delete',
    'assets:read-history',
    // allocation & transfer
    'allocation:create',
    'allocation:read',
    'allocation:manage',
    'transfer:create',
    'transfer:read',
    'transfer:approve',
    // booking
    'booking:create',
    'booking:read',
    'booking:cancel',
    // maintenance
    'maintenance:raise',
    'maintenance:read',
    'maintenance:approve',
    'maintenance:assign-technician',
    'maintenance:resolve',
    'maintenance:reject',
    // audit
    'audit:create-cycle',
    'audit:assign-auditors',
    'audit:record-result',
    'audit:close-cycle',
    'audit:read',
    // notifications
    'notifications:read',
    'notifications:mark-read',
    // dashboards & reports
    'dashboard:view',
    'reports:view',
    'reports:export',
  ],

  [ROLES.DEPARTMENT_HEAD]: [
    // department-scoped visibility of master data
    'organization:read',
    'employees:read',
    // assets — read + history within their department
    'assets:read',
    'assets:read-history',
    // allocation & transfer (department context)
    'allocation:read',
    'transfer:read',
    'transfer:approve',
    // booking
    'booking:create',
    'booking:read',
    'booking:cancel',
    // maintenance
    'maintenance:raise',
    'maintenance:read',
    'maintenance:approve',
    // audit
    'audit:create-cycle',
    'audit:assign-auditors',
    'audit:record-result',
    'audit:read',
    // notifications
    'notifications:read',
    'notifications:mark-read',
    // dashboards & reports (department scope applied by the consumer)
    'dashboard:view',
    'reports:view',
  ],

  [ROLES.EMPLOYEE]: [
    // self
    'auth:read-self',
    'auth:reset-password',
    // assets — browse the directory
    'assets:read',
    // booking — book resources for themselves
    'booking:create',
    'booking:read',
    'booking:cancel',
    // maintenance — raise issues on assets they use
    'maintenance:raise',
    'maintenance:read',
    // notifications
    'notifications:read',
    'notifications:mark-read',
    // personal dashboard
    'dashboard:view',
  ],
});

// ─── Derived: action -> roles (the permissions matrix) ──────────────────────

/**
 * Inverse of `ROLE_PERMISSIONS`: action -> list of roles allowed to perform
 * it. Derived once at module load by walking the canonical ALL_ACTIONS
 * universe, so admin-only actions (e.g. "organization:manage") are present
 * even though they are granted to ADMIN only via the wildcard.
 */
const PERMISSIONS = Object.freeze(
  Object.fromEntries(
    ALL_ACTIONS.map((action) => {
      const roles = ALL_ROLES.filter((role) => {
        const grants = ROLE_PERMISSIONS[role] || [];
        return grants.includes(WILDCARD) || grants.includes(action);
      });
      return [action, Object.freeze([...roles])];
    }),
  ),
);

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Pure check: can `role` perform `action`?
 *
 * @param {string} role - one of ROLES
 * @param {string} action - a namespaced action key (e.g. "assets:update")
 * @returns {boolean}
 */
function can(role, action) {
  const grants = ROLE_PERMISSIONS[role];
  if (!grants) return false;
  if (grants.includes(WILDCARD)) return true;
  return grants.includes(action);
}

/**
 * Middleware factory: protect a route by intent rather than by role list.
 *
 * Reads the permissions matrix to resolve the allowed roles for `action` and
 * enforces access. Behaviour mirrors the existing `authorize(...roles)`
 * guard: 401 "Authentication required" when there is no authenticated user,
 * 403 "Insufficient permissions" when the role is not permitted. Use this
 * when you want the matrix to stay the single source of truth; use
 * `authorize(...roles)` when you need an ad-hoc role list.
 *
 * Usage:
 *   router.post('/', authenticate, requirePermission('assets:create'), controller)
 *
 * @param {string} action - a namespaced action key
 * @returns {Function} Express middleware
 */
function requirePermission(action) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }
    if (!can(req.user.role, action)) {
      return next(new ApiError(403, 'Insufficient permissions'));
    }
    return next();
  };
}

/**
 * Department scoping helper for Department Heads.
 *
 * Department Heads must only see data that belongs to their own department,
 * while ADMIN / ASSET_MANAGER operate globally. Returns a Prisma `where`
 * fragment that callers spread into their own query filters, e.g.:
 *
 *   const scope = getDepartmentScope(actingUser);
 *   prisma.asset.findMany({ where: { ...scope, ...userFilters } });
 *
 * Expects an object with at least `{ role, departmentId? }`. The middleware
 * only attaches `{ userId, role }` to `req.user`, so services that need
 * scoping should fetch the acting user (they already look users up) and pass
 * that record here. If a Department Head has no department assigned, a
 * non-matchable id is used so that no records leak.
 *
 * @param {{ role: string, departmentId?: string|null }} user
 * @returns {Record<string, unknown>} a Prisma `where` fragment
 */
function getDepartmentScope(user) {
  if (!user || user.role === ROLES.DEPARTMENT_HEAD) {
    const deptId = user?.departmentId;
    return { departmentId: deptId || '__NO_DEPARTMENT_ASSIGNED__' };
  }
  // ADMIN and ASSET_MANAGER see everything.
  return {};
}

module.exports = {
  ROLES,
  ALL_ROLES,
  MODULE_ACTIONS,
  ALL_ACTIONS,
  ROLE_PERMISSIONS,
  PERMISSIONS,
  WILDCARD,
  can,
  requirePermission,
  getDepartmentScope,
};
