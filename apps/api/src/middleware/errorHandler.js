/**
 * Structured application error.
 * Only operational errors (isOperational = true) are safe to expose to the client.
 */
class AppError extends Error {
  /**
   * @param {string} message  Human-readable message
   * @param {number} statusCode  HTTP status code
   * @param {string} [code]  Machine-readable error code (e.g. AUTH_INVALID_TOKEN)
   * @param {boolean} [isOperational=true]  Whether this is an expected/operational error
   */
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', isOperational = true) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Wraps an async route handler so thrown / rejected errors are forwarded to
 * Express's error-handling pipeline instead of becoming unhandled rejections.
 *
 * @param {Function} fn  Async route handler (req, res, next) => Promise<void>
 * @returns {Function}
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Global Express error-handling middleware.
 * Must be registered AFTER all routes.
 */
// eslint-disable-next-line no-unused-vars
function globalErrorHandler(err, req, res, _next) {
  const logger = require('../utils/logger');

  // Default values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let code = err.code || 'INTERNAL_ERROR';
  const isOperational = err.isOperational ?? false;

  // JWT-specific errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
    code = 'AUTH_INVALID_TOKEN';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired';
    code = 'AUTH_TOKEN_EXPIRED';
  }

  // Log the error
  if (statusCode >= 500) {
    logger.error(`[${code}] ${message}`, {
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      requestId: req.id,
    });
  } else {
    logger.warn(`[${code}] ${message}`, {
      url: req.originalUrl,
      method: req.method,
      requestId: req.id,
    });
  }

  // In production hide non-operational error details
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction && !isOperational && statusCode >= 500) {
    message = 'An unexpected error occurred. Please try again later.';
    code = 'INTERNAL_ERROR';
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code,
      ...(err.details ? { details: err.details } : {}),
      ...(!isProduction && err.stack ? { stack: err.stack } : {}),
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: req.id || null,
    },
  });
}

module.exports = { AppError, asyncHandler, globalErrorHandler };
