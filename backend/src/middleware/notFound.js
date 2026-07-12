const ApiError = require('../utils/ApiError');

/**
 * 404 fallback. Registered after all routes so any unmatched path
 * produces the standard error shape instead of Express's default HTML.
 */
const notFound = (req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

module.exports = notFound;
