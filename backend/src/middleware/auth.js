const jwt = require('jsonwebtoken');
const config = require('../config/env');
const ApiError = require('../utils/ApiError');

/**
 * Authentication middleware.
 * Verifies the Authorization: Bearer <token> header and attaches
 * `req.user = { userId, role, organizationId }` for downstream controllers/services.
 *
 * Usage:
 *   router.get('/me', authenticate, controller.getMe)
 */
const authenticate = (req, _res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Authentication required'));
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      organizationId: decoded.organizationId || null,
    };
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Token expired'));
    }
    return next(new ApiError(401, 'Invalid token'));
  }
};

/**
 * Role guard — factory that returns a middleware checking req.user.role.
 * Works only after the authenticate middleware has run.
 *
 * Usage:
 *   router.delete('/', authenticate, authorize('ADMIN'), controller)
 */
const authorize = (...roles) => (req, _res, next) => {
  if (!req.user) return next(new ApiError(401, 'Authentication required'));
  if (req.user.role === 'SUPER_ADMIN') return next();
  if (!roles.includes(req.user.role)) {
    return next(new ApiError(403, 'Insufficient permissions'));
  }
  return next();
};

module.exports = { authenticate, authorize };
