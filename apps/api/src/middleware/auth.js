const jwt = require('jsonwebtoken');
const config = require('../config');
const { db } = require('../config/database');
const { AppError } = require('./errorHandler');

/**
 * Middleware: verify the JWT access token from the Authorization header
 * and attach the decoded user object to `req.user`.
 */
async function authenticate(req, _res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required. Please provide a valid token.', 401, 'AUTH_NO_TOKEN');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new AppError('Authentication required. Please provide a valid token.', 401, 'AUTH_NO_TOKEN');
    }

    const decoded = jwt.verify(token, config.jwt.secret, {
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    });

    // Confirm user still exists and is active
    const user = await db('users')
      .select('id', 'email', 'first_name', 'last_name', 'role', 'is_active', 'is_verified')
      .where({ id: decoded.sub })
      .whereNull('deleted_at')
      .first();

    if (!user) {
      throw new AppError('User belonging to this token no longer exists.', 401, 'AUTH_USER_NOT_FOUND');
    }

    if (!user.is_active) {
      throw new AppError('Your account has been deactivated. Contact support.', 403, 'AUTH_ACCOUNT_DISABLED');
    }

    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      isVerified: Boolean(user.is_verified),
    };

    next();
  } catch (err) {
    if (err instanceof AppError) return next(err);
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') return next(err);
    next(new AppError('Authentication failed.', 401, 'AUTH_FAILED'));
  }
}

/**
 * Middleware factory: restrict access to specific roles.
 *
 * @param  {...string} allowedRoles  e.g. 'DOCTOR', 'SUPER_ADMIN'
 * @returns {Function} Express middleware
 */
function authorize(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required before authorisation.', 401, 'AUTH_NO_TOKEN'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. Required role(s): ${allowedRoles.join(', ')}`,
          403,
          'AUTH_INSUFFICIENT_ROLE',
        ),
      );
    }

    next();
  };
}

module.exports = { authenticate, authorize };
