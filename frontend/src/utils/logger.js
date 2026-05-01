const isDev = process.env.NODE_ENV !== 'production';

/**
 * Dev-only console wrapper. No-ops in production to avoid leaking debug info
 * and reduce bundle noise. Prefer this over raw `console.*` everywhere.
 *
 * Usage:
 *   import { logger } from '../utils/logger';
 *   logger.log('hello');
 *   logger.error('oops', err);
 */
export const logger = {
  log: (...args) => { if (isDev) console.log(...args); },
  info: (...args) => { if (isDev) console.info(...args); },
  warn: (...args) => { if (isDev) console.warn(...args); },
  error: (...args) => { if (isDev) console.error(...args); },
  debug: (...args) => { if (isDev) console.debug(...args); },
};

export default logger;
