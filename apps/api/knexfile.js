const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

/** @type {import('knex').Knex.Config} */
const commonMigrations = {
  directory: path.resolve(__dirname, 'migrations'),
};

const commonSeeds = {
  directory: path.resolve(__dirname, 'seeds'),
};

module.exports = {
  development: {
    client: 'better-sqlite3',
    connection: {
      filename: path.resolve(__dirname, 'data', 'elderguardian.db'),
    },
    useNullAsDefault: true,
    migrations: commonMigrations,
    seeds: commonSeeds,
    pool: {
      afterCreate(conn, cb) {
        conn.pragma('journal_mode = WAL');
        conn.pragma('foreign_keys = ON');
        conn.pragma('busy_timeout = 5000');
        conn.pragma('synchronous = NORMAL');
        cb();
      },
    },
  },

  test: {
    client: 'better-sqlite3',
    connection: {
      filename: ':memory:',
    },
    useNullAsDefault: true,
    migrations: commonMigrations,
    seeds: commonSeeds,
    pool: {
      afterCreate(conn, cb) {
        conn.pragma('foreign_keys = ON');
        cb();
      },
    },
  },

  production: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USER || 'elderguardian',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'elderguardian',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    },
    pool: {
      min: 2,
      max: 10,
      acquireTimeoutMillis: 30000,
    },
    migrations: commonMigrations,
    seeds: commonSeeds,
  },
};
