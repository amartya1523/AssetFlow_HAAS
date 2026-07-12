/**
 * Environment-aware configuration.
 * Centralizes access to env vars so the rest of the app never reads
 * process.env directly (consistent config management).
 */
require('dotenv').config();

const env = process.env.NODE_ENV || 'development';

const config = {
  env,
  isDev: env === 'development',
  isProd: env === 'production',
  isTest: env === 'test',

  port: parseInt(process.env.PORT, 10) || 5000,

  databaseUrl: process.env.DATABASE_URL,

  jwt: {
    secret: process.env.JWT_SECRET || 'dev_insecure_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  // Uploads handled by multer in later tasks
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
};

module.exports = config;
