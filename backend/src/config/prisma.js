/**
 * Prisma client singleton.
 *
 * Prisma ORM v7 requires a driver adapter. We use @prisma/adapter-pg with
 * the DATABASE_URL from config. A single shared instance is cached on
 * globalThis so nodemon hot-reloads in dev don't exhaust connections.
 */
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const config = require('./env');

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: config.databaseUrl });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis;

const prisma = globalForPrisma.__prismaClient || createPrismaClient();

if (config.isDev) {
  globalForPrisma.__prismaClient = prisma;
}

module.exports = prisma;
