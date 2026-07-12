const config = require('../config/env');
const ApiError = require('../utils/ApiError');

/**
 * Centralized error handler — must be registered LAST (after all routes
 * and the 404 fallback). Converts any thrown error into the standard
 * error shape: { success: false, message, errors }.
 *
 * Prisma known request errors (e.g. unique constraint, record not found)
 * are mapped to clean HTTP errors so DB internals never leak to clients.
 */
const { Prisma } = require('@prisma/client');

function mapPrismaError(err) {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': {
        // unique constraint violation
        const target = err.meta?.target?.join(', ') || 'field';
        return new ApiError(409, `Duplicate value for: ${target}`);
      }
      case 'P2025':
        // record not found
        return new ApiError(404, 'Resource not found');
      case 'P2003':
        // foreign key violation
        return new ApiError(400, 'Referenced resource does not exist');
      default:
        return new ApiError(400, 'Database request error');
    }
  }
  return null;
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let error = err;

  // Normalize Prisma errors first
  const prismaMapped = mapPrismaError(err);
  if (prismaMapped) error = prismaMapped;

  const statusCode = error.statusCode || 500;
  const isOperational = error.isOperational === true || statusCode < 500;

  // Always log; full stack only in non-production for server-side debugging
  if (statusCode >= 500 || err instanceof Prisma.PrismaClientKnownRequestError || err.name?.startsWith('Prisma')) {
    // eslint-disable-next-line no-console
    console.error('[ERROR]', err);
  } else if (config.isDev) {
    // eslint-disable-next-line no-console
    console.warn('[WARN]', err.message);
  }

  const body = {
    success: false,
    message: isOperational ? error.message : 'Internal server error',
  };

  if (error.errors && Array.isArray(error.errors) && error.errors.length) {
    body.errors = error.errors;
  }

  return res.status(statusCode).json(body);
}

module.exports = errorHandler;
