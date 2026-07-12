const express = require('express');
const cors = require('cors');

const config = require('./config/env');
const requestLogger = require('./middleware/requestLogger');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const allocationRoutes = require('./routes/allocation.routes');
const transferRoutes = require('./routes/transfer.routes');

/**
 * Express app factory. Separating app creation from server.listen
 * keeps middleware wiring testable and lets later tasks (and tests)
 * import the app without binding a port.
 */
function createApp() {
  const app = express();

  // --- Global middleware (order matters) ---
  app.use(cors({ origin: config.clientUrl, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  // --- Routes ---
  app.use('/api/v1/health', healthRoutes);
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/allocations', allocationRoutes);
  app.use('/api/v1/transfers', transferRoutes);

  // --- Fallbacks (must be last) ---
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
