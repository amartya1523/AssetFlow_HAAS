const prisma = require('../config/prisma');

/**
 * Health service — business rules for the health/readiness check.
 * Keeps DB-touching logic out of the controller so controllers stay
 * thin. Later modules (auth, assets, etc.) follow the same
 * service-layer pattern for all workflows.
 */
async function getHealth() {
  let db = 'ok';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (e) {
    db = 'error';
  }

  return {
    status: db === 'ok' ? 'ok' : 'degraded',
    database: db,
    timestamp: new Date().toISOString(),
  };
}

module.exports = { getHealth };
