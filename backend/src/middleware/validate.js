const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/**
 * Validation middleware. Place AFTER an express-validator chain so it
 * inspects the request and short-circuits into the error handler when
 * rules fail. Returns the standard error shape with a per-field `errors`
 * array so the frontend can map messages to inputs.
 *
 * Usage:
 *   router.post('/x', [body('email').isEmail()], validate, controller)
 */
const validate = (req, _res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array().map((e) => ({
    field: e.path,
    message: e.msg,
  }));

  next(new ApiError(422, 'Validation failed', errors));
};

module.exports = validate;
