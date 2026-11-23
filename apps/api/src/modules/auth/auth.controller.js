const { v4: uuidv4 } = require('uuid');
const { db } = require('../../config/database');
const { AppError, asyncHandler } = require('../../middleware/errorHandler');
const { success } = require('../../utils/response');
const authService = require('./auth.service');

// ──────────────────────────────────────────────────────────────────────
// POST /register
// ──────────────────────────────────────────────────────────────────────
const register = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, phone, role } = req.body;

  // Check uniqueness
  const existing = await db('users').where({ email }).whereNull('deleted_at').first();
  if (existing) {
    throw new AppError('An account with this email already exists.', 409, 'AUTH_EMAIL_EXISTS');
  }

  if (phone) {
    const phoneExists = await db('users').where({ phone }).whereNull('deleted_at').first();
    if (phoneExists) {
      throw new AppError('An account with this phone number already exists.', 409, 'AUTH_PHONE_EXISTS');
    }
  }

  const userId = uuidv4();
  const passwordHash = await authService.hashPassword(password);
  const now = new Date().toISOString();

  await db.transaction(async (trx) => {
    // Create user
    await trx('users').insert({
      id: userId,
      email,
      phone: phone || null,
      password_hash: passwordHash,
      first_name: firstName,
      last_name: lastName,
      role,
      is_active: true,
      is_verified: false,
      created_at: now,
      updated_at: now,
    });

    // Create role-specific profile
    if (role === 'PATIENT') {
      await trx('patients').insert({
        id: uuidv4(),
        user_id: userId,
        created_at: now,
        updated_at: now,
      });
    }

    if (role === 'DOCTOR') {
      await trx('doctors').insert({
        id: uuidv4(),
        user_id: userId,
        license_number: `TEMP-${userId.slice(0, 8).toUpperCase()}`,
        created_at: now,
        updated_at: now,
      });
    }
  });

  const user = await db('users')
    .select('id', 'email', 'phone', 'first_name', 'last_name', 'role', 'is_active', 'is_verified', 'created_at')
    .where({ id: userId })
    .first();

  const accessToken = authService.generateAccessToken(user);
  const refreshToken = await authService.generateRefreshToken(user, req);

  await authService.createAuditLog(userId, 'USER_REGISTER', 'USER', userId, {}, req);

  success(res, {
    user: formatUser(user),
    tokens: {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
    },
  }, 201);
});

// ──────────────────────────────────────────────────────────────────────
// POST /login
// ──────────────────────────────────────────────────────────────────────
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await db('users')
    .where({ email })
    .whereNull('deleted_at')
    .first();

  if (!user) {
    throw new AppError('Invalid email or password.', 401, 'AUTH_INVALID_CREDENTIALS');
  }

  const isMatch = await authService.comparePasswords(password, user.password_hash);
  if (!isMatch) {
    throw new AppError('Invalid email or password.', 401, 'AUTH_INVALID_CREDENTIALS');
  }

  if (!user.is_active) {
    throw new AppError('Your account has been deactivated. Contact support.', 403, 'AUTH_ACCOUNT_DISABLED');
  }

  // Update last login
  const now = new Date().toISOString();
  await db('users').where({ id: user.id }).update({ last_login_at: now, updated_at: now });

  const accessToken = authService.generateAccessToken(user);
  const refreshToken = await authService.generateRefreshToken(user, req);

  await authService.createAuditLog(user.id, 'USER_LOGIN', 'USER', user.id, {}, req);

  success(res, {
    user: formatUser(user),
    tokens: {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
    },
  });
});

// ──────────────────────────────────────────────────────────────────────
// POST /refresh-token
// ──────────────────────────────────────────────────────────────────────
const refreshTokenHandler = asyncHandler(async (req, res) => {
  const { refreshToken: rawToken } = req.body;

  const storedToken = await authService.verifyRefreshToken(rawToken);
  if (!storedToken) {
    throw new AppError('Invalid or expired refresh token.', 401, 'AUTH_INVALID_REFRESH_TOKEN');
  }

  // Revoke old token (rotation)
  await authService.revokeRefreshToken(storedToken.id);

  const user = await db('users')
    .select('id', 'email', 'phone', 'first_name', 'last_name', 'role', 'is_active', 'is_verified')
    .where({ id: storedToken.user_id })
    .whereNull('deleted_at')
    .first();

  if (!user || !user.is_active) {
    throw new AppError('User account is no longer active.', 401, 'AUTH_ACCOUNT_DISABLED');
  }

  const accessToken = authService.generateAccessToken(user);
  const newRefreshToken = await authService.generateRefreshToken(user, req);

  success(res, {
    tokens: {
      accessToken,
      refreshToken: newRefreshToken,
      tokenType: 'Bearer',
    },
  });
});

// ──────────────────────────────────────────────────────────────────────
// POST /logout
// ──────────────────────────────────────────────────────────────────────
const logout = asyncHandler(async (req, res) => {
  const { refreshToken: rawToken } = req.body;

  if (rawToken) {
    const storedToken = await authService.verifyRefreshToken(rawToken);
    if (storedToken) {
      await authService.revokeRefreshToken(storedToken.id);
    }
  }

  if (req.user) {
    await authService.createAuditLog(req.user.id, 'USER_LOGOUT', 'USER', req.user.id, {}, req);
  }

  success(res, { message: 'Logged out successfully.' });
});

// ──────────────────────────────────────────────────────────────────────
// GET /me
// ──────────────────────────────────────────────────────────────────────
const getMe = asyncHandler(async (req, res) => {
  const user = await db('users')
    .select('id', 'email', 'phone', 'first_name', 'last_name', 'role', 'is_active', 'is_verified', 'avatar_url', 'last_login_at', 'created_at')
    .where({ id: req.user.id })
    .whereNull('deleted_at')
    .first();

  if (!user) {
    throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
  }

  let profile = null;

  if (user.role === 'PATIENT') {
    profile = await db('patients').where({ user_id: user.id }).whereNull('deleted_at').first();
  } else if (user.role === 'DOCTOR') {
    profile = await db('doctors')
      .leftJoin('specializations', 'doctors.specialization_id', 'specializations.id')
      .where({ 'doctors.user_id': user.id })
      .whereNull('doctors.deleted_at')
      .select('doctors.*', 'specializations.name as specialization_name')
      .first();
  }

  success(res, {
    user: formatUser(user),
    profile: profile || null,
  });
});

// ─── helpers ────────────────────────────────────────────────────────

function formatUser(row) {
  return {
    id: row.id,
    email: row.email,
    phone: row.phone || null,
    firstName: row.first_name,
    lastName: row.last_name,
    role: row.role,
    isActive: Boolean(row.is_active),
    isVerified: Boolean(row.is_verified),
    avatarUrl: row.avatar_url || null,
    lastLoginAt: row.last_login_at || null,
    createdAt: row.created_at,
  };
}

module.exports = {
  register,
  login,
  refreshToken: refreshTokenHandler,
  logout,
  getMe,
};
