const express = require('express');
const cors = require('cors');

const config = require('./config/env');
const requestLogger = require('./middleware/requestLogger');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

const departmentRoutes = require('./routes/department.routes');
const categoryRoutes = require('./routes/category.routes');
const employeeRoutes = require('./routes/employee.routes');
const userRoutes = require('./routes/user.routes');
const assetRoutes = require('./routes/asset.routes');

const allocationRoutes = require('./routes/allocation.routes');
const transferRoutes = require('./routes/transfer.routes');
const platformRoutes = require('./routes/platform.routes');
const bookingRoutes = require('./routes/booking.routes');
const maintenanceRoutes = require('./routes/maintenance.routes');
const auditCycleRoutes = require('./routes/auditCycle.routes');
const auditItemRoutes = require('./routes/auditItem.routes');
const notificationRoutes = require('./routes/notification.routes');
const activityLogRoutes = require('./routes/activityLog.routes');
const reportsRoutes = require('./routes/reports.routes');


/**
 * Express app factory. Separating app creation from server.listen
 * keeps middleware wiring testable and lets later tasks (and tests)
 * import the app without binding a port.
 */
function createApp() {
  const app = express();

  // --- Global middleware (order matters) ---
  app.use((req, res, next) => {
    console.log('[DEBUG CORS] Request Origin:', req.headers.origin, 'Allowed CLIENT_URL:', config.clientUrl);
    next();
  });
  app.use(cors({ origin: config.clientUrl, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  // --- Routes ---
  app.use('/api/v1/health', healthRoutes);
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/dashboard', dashboardRoutes);
  app.use('/api/v1/departments', departmentRoutes);
  app.use('/api/v1/categories', categoryRoutes);
  app.use('/api/v1/employees', employeeRoutes);
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/assets', assetRoutes);
  app.use('/api/v1/allocations', allocationRoutes);
  app.use('/api/v1/transfers', transferRoutes);
  app.use('/api/v1/platform', platformRoutes);
  app.use('/api/v1/bookings', bookingRoutes);
  app.use('/api/v1/maintenance', maintenanceRoutes);
  app.use('/api/v1/audit-cycles', auditCycleRoutes);
  app.use('/api/v1/audit-items', auditItemRoutes);
  app.use('/api/v1/notifications', notificationRoutes);
  app.use('/api/v1/activity-logs', activityLogRoutes);
  app.use('/api/v1/reports', reportsRoutes);

  // --- Fallbacks (must be last) ---
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
