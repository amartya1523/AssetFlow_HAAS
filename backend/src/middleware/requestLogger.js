const config = require('../config/env');

/**
 * Minimal request logger. Logs method, path, and response status with
 * latency. Verbose in dev, compact in production.
 */
const requestLogger = (req, res, next) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    const { method, originalUrl } = req;
    const { statusCode } = res;

    const line = `${method} ${originalUrl} ${statusCode} ${durationMs.toFixed(1)}ms`;

    if (statusCode >= 500) {
      // eslint-disable-next-line no-console
      console.error(line);
    } else if (statusCode >= 400) {
      // eslint-disable-next-line no-console
      console.warn(line);
    } else {
      // eslint-disable-next-line no-console
      console.log(line);
    }

    if (config.isDev && method !== 'GET') {
      // eslint-disable-next-line no-console
      console.debug('  body:', req.body);
    }
  });

  next();
};

module.exports = requestLogger;
