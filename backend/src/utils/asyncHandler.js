/**
 * Wraps an async route handler so rejected promises are forwarded to
 * Express's error-handling middleware instead of needing try/catch in
 * every controller. Keeps controllers thin and free of boilerplate.
 *
 * @param {Function} fn - async (req, res, next) => {}
 * @returns {Function} Express middleware
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
