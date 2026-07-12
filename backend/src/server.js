const config = require('./config/env');
const createApp = require('./app');

const app = createApp();

const server = app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`AssetFlow API running on port ${config.port} (${config.env})`);
});

// Graceful shutdown — close HTTP server then disconnect Prisma
const prisma = require('./config/prisma');

const shutdown = async (signal) => {
  // eslint-disable-next-line no-console
  console.log(`\n${signal} received, shutting down...`);
  server.close(async () => {
    try {
      await prisma.$disconnect();
      process.exit(0);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Error during shutdown:', e);
      process.exit(1);
    }
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = server;
