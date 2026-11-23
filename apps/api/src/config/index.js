const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),

  jwt: {
    secret: process.env.JWT_SECRET || 'CHANGE_ME_in_production_32char_min',
    expiry: process.env.JWT_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '30d',
    issuer: 'elderguardian-api',
    audience: 'elderguardian-client',
  },

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'elderguardian',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'elderguardian',
    ssl: process.env.DB_SSL === 'true',
  },

  cors: {
    origins: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
      : ['http://localhost:3000', 'http://localhost:5173'],
  },

  rateLimit: {
    auth: {
      windowMs: 15 * 60 * 1000,
      max: parseInt(process.env.RATE_LIMIT_AUTH || '100', 10),
    },
    general: {
      windowMs: 15 * 60 * 1000,
      max: parseInt(process.env.RATE_LIMIT_GENERAL || '200', 10),
    },
  },

  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
  },
};

// Guard against running production without a real secret
if (config.env === 'production' && config.jwt.secret === 'CHANGE_ME_in_production_32char_min') {
  throw new Error('JWT_SECRET must be set in production');
}

module.exports = config;
