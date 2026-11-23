const config = require('./config');
const logger = require('./utils/logger');
const app = require('./app');
const { runMigrations, destroyConnection } = require('./config/database');

async function start() {
  try {
    // Run pending migrations before accepting traffic
    await runMigrations();

    const server = app.listen(config.port, () => {
      logger.info(`ElderGuardian API running on port ${config.port} [${config.env}]`);
    });

    // ─── Graceful shutdown ───────────────────────────────────────────
    const shutdown = async (signal) => {
      logger.info(`${signal} received — shutting down gracefully`);

      server.close(async () => {
        logger.info('HTTP server closed');
        await destroyConnection();
        process.exit(0);
      });

      // Force exit after 10 s if connections linger
      setTimeout(() => {
        logger.error('Forcing shutdown after timeout');
        process.exit(1);
      }, 10_000).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Catch uncaught exceptions / unhandled rejections
    process.on('uncaughtException', (err) => {
      logger.error('Uncaught exception', err);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled rejection', reason);
      process.exit(1);
    });
  } catch (err) {
    logger.error('Failed to start server', err);
    process.exit(1);
  }
}

start();
