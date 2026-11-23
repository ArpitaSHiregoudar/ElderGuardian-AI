const LEVELS = {
  debug: { priority: 0, label: 'DEBUG', color: '\x1b[36m' },
  info:  { priority: 1, label: 'INFO ', color: '\x1b[32m' },
  warn:  { priority: 2, label: 'WARN ', color: '\x1b[33m' },
  error: { priority: 3, label: 'ERROR', color: '\x1b[31m' },
};

const RESET = '\x1b[0m';

const currentLevel = (process.env.LOG_LEVEL || 'debug').toLowerCase();
const currentPriority = LEVELS[currentLevel]?.priority ?? 0;

/**
 * Write a log entry to stdout/stderr.
 *
 * @param {'debug'|'info'|'warn'|'error'} level
 * @param {string} message
 * @param {*} [extra]
 */
function log(level, message, extra) {
  const meta = LEVELS[level];
  if (!meta || meta.priority < currentPriority) return;

  const timestamp = new Date().toISOString();
  const prefix = `${meta.color}[${timestamp}] [${meta.label}]${RESET}`;
  const out = level === 'error' ? process.stderr : process.stdout;

  if (extra !== undefined) {
    const extraStr = extra instanceof Error ? extra.stack || extra.message : JSON.stringify(extra);
    out.write(`${prefix} ${message} ${extraStr}\n`);
  } else {
    out.write(`${prefix} ${message}\n`);
  }
}

const logger = {
  debug: (msg, extra) => log('debug', msg, extra),
  info:  (msg, extra) => log('info', msg, extra),
  warn:  (msg, extra) => log('warn', msg, extra),
  error: (msg, extra) => log('error', msg, extra),
};

module.exports = logger;
