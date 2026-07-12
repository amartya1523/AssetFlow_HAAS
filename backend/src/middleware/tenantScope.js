const ApiError = require('../utils/ApiError');

/**
 * Attach a normalized tenant scope to the request.
 *
 * Normal tenant users are always scoped to their JWT organization. SUPER_ADMIN
 * can optionally provide ?organizationId=... when drilling into tenant data.
 */
const requireTenantScope = (req, _res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized('Authentication required'));
  }

  if (req.user.role === 'SUPER_ADMIN') {
    req.tenant = {
      organizationId: req.query.organizationId || req.params.organizationId || null,
      isPlatform: true,
    };
    return next();
  }

  if (!req.user.organizationId) {
    return next(ApiError.forbidden('Organization scope is required'));
  }

  req.tenant = {
    organizationId: req.user.organizationId,
    isPlatform: false,
  };
  return next();
};

module.exports = { requireTenantScope };
