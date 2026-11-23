const { AppError } = require('./errorHandler');

/**
 * Middleware factory: validate `req.body` against a Zod schema.
 *
 * @param {import('zod').ZodSchema} schema
 * @returns {Function} Express middleware
 */
function validate(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }));

      const err = new AppError('Validation failed', 422, 'VALIDATION_ERROR');
      err.details = details;
      return next(err);
    }

    // Replace body with the parsed (and coerced/stripped) data
    req.body = result.data;
    next();
  };
}

module.exports = { validate };
