const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const healthService = require('../services/health.service');

/**
 * GET /api/v1/health
 * Thin controller: delegates to service, formats response.
 */
const health = asyncHandler(async (_req, res) => {
  const data = await healthService.getHealth();
  return sendSuccess(res, { data });
});

module.exports = { health };
