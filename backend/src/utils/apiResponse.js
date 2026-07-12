/**
 * API response helpers enforcing the standard success shape:
 *   { success: true, data: ... }
 *
 * The matching error shape lives in the error handler middleware.
 */

/**
 * Send a success response.
 * @param {import('express').Response} res
 * @param {object} options
 * @param {number} [options.statusCode=200]
 * @param {*} options.data - payload to return
 * @param {string} [options.message] - optional human message
 */
const sendSuccess = (res, { statusCode = 200, data = null, message }) => {
  const body = { success: true, data };
  if (message) body.message = message;
  return res.status(statusCode).json(body);
};

/**
 * Send a created (201) success response.
 */
const sendCreated = (res, data, message) =>
  sendSuccess(res, { statusCode: 201, data, message });

module.exports = { sendSuccess, sendCreated };
