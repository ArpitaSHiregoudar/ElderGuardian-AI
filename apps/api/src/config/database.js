const knex = require('knex');
const knexfile = require('../../knexfile');
const config = require('./index');
const logger = require('../utils/logger');

const environment = config.env;
const connectionConfig = knexfile[environment];

if (!connectionConfig) {
  throw new Error(`No Knex configuration found for environment: ${environment}`);
}

const db = knex(connectionConfig);

/**
 * Run pending migrations.
 * @returns {Promise<void>}
 */
async function runMigrations() {
  try {
    const [batch, migrations] = await db.migrate.latest();
    if (migrations.length > 0) {
      logger.info(`Ran ${migrations.length} migration(s) in batch ${batch}`);
      migrations.forEach((m) => logger.info(`  ↳ ${m}`));
    } else {
      logger.info('Database is up to date — no pending migrations');
    }
  } catch (err) {
    logger.error('Migration failed', err);
    throw err;
  }
}

/**
 * Destroy the database connection pool.
 * @returns {Promise<void>}
 */
async function destroyConnection() {
  await db.destroy();
  logger.info('Database connection pool destroyed');
}

module.exports = { db, runMigrations, destroyConnection };
