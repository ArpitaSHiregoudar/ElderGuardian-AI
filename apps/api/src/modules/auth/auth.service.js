const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const config = require('../../config');
const { db } = require('../../config/database');

/**
 * Generate a short-lived JWT access token.
 * @param {{ id: string, email: string, role: string }} user
 * @returns {string}
 */
function generateAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    config.jwt.secret,
    {
      expiresIn: config.jwt.expiry,
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    },
  );
}

/**
 * Generate a long-lived opaque refresh token and persist its hash.
 *
 * @param {{ id: string }} user
 * @param {import('express').Request} req
 * @returns {Promise<string>} The raw refresh token to send to the client
 */
async function generateRefreshToken(user, req) {
  const rawToken = uuidv4();
  const tokenHash = await bcrypt.hash(rawToken, 10);

  await db('refresh_tokens').insert({
    id: uuidv4(),
    user_id: user.id,
    token_hash: tokenHash,
    expires_at: new Date(Date.now() + parseDuration(config.jwt.refreshExpiry)).toISOString(),
    device_info: req.headers['user-agent'] || null,
    ip_address: req.ip,
  });

  return rawToken;
}

/**
 * Verify a refresh token against stored hashes.
 *
 * @param {string} rawToken
 * @returns {Promise<object>} The refresh-token row
 */
async function verifyRefreshToken(rawToken) {
  // Pull all non-revoked, non-expired tokens — usually very few per user
  const tokens = await db('refresh_tokens')
    .where({ is_revoked: false })
    .where('expires_at', '>', new Date().toISOString())
    .select('*');

  for (const row of tokens) {
    // eslint-disable-next-line no-await-in-loop
    const match = await bcrypt.compare(rawToken, row.token_hash);
    if (match) return row;
  }

  return null;
}

/**
 * Revoke a refresh token by its row id.
 * @param {string} tokenId
 */
async function revokeRefreshToken(tokenId) {
  await db('refresh_tokens')
    .where({ id: tokenId })
    .update({ is_revoked: true, revoked_at: new Date().toISOString() });
}

/**
 * Hash a plain-text password.
 * @param {string} password
 * @returns {Promise<string>}
 */
async function hashPassword(password) {
  return bcrypt.hash(password, config.bcrypt.saltRounds);
}

/**
 * Compare a plain-text password with its hash.
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
async function comparePasswords(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Insert an audit-log entry.
 *
 * @param {string|null} userId
 * @param {string} action
 * @param {string} resourceType
 * @param {string} resourceId
 * @param {{ oldValues?: object, newValues?: object }} details
 * @param {import('express').Request} req
 */
async function createAuditLog(userId, action, resourceType, resourceId, details = {}, req = {}) {
  await db('audit_logs').insert({
    id: uuidv4(),
    user_id: userId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    old_values: details.oldValues ? JSON.stringify(details.oldValues) : null,
    new_values: details.newValues ? JSON.stringify(details.newValues) : null,
    ip_address: req.ip || null,
    user_agent: req.headers?.['user-agent'] || null,
  });
}

// ─── helpers ────────────────────────────────────────────────────────

/**
 * Convert a human-readable duration string (e.g. "30d", "15m", "2h") to ms.
 * @param {string} str
 * @returns {number}
 */
function parseDuration(str) {
  const match = str.match(/^(\d+)\s*(s|m|h|d)$/i);
  if (!match) return 30 * 24 * 60 * 60 * 1000; // fallback 30 days
  const val = parseInt(match[1], 10);
  switch (match[2].toLowerCase()) {
    case 's': return val * 1000;
    case 'm': return val * 60 * 1000;
    case 'h': return val * 60 * 60 * 1000;
    case 'd': return val * 24 * 60 * 60 * 1000;
    default:  return 30 * 24 * 60 * 60 * 1000;
  }
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  hashPassword,
  comparePasswords,
  createAuditLog,
};
