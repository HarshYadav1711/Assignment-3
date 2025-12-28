/**
 * Simple logging utility for the automation scripts
 * Provides consistent logging format with timestamps
 */

const logLevels = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

/**
 * Formats log message with timestamp and level
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {any} data - Optional additional data
 */
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...(data && { data })
  };

  const logString = `[${timestamp}] [${level}] ${message}${data ? ` ${JSON.stringify(data, null, 2)}` : ''}`;
  
  // Use console methods based on level
  switch (level) {
    case logLevels.ERROR:
      console.error(logString);
      break;
    case logLevels.WARN:
      console.warn(logString);
      break;
    case logLevels.DEBUG:
      // Only log debug in development
      if (process.env.NODE_ENV !== 'production') {
        console.debug(logString);
      }
      break;
    default:
      console.log(logString);
  }
}

export const logger = {
  error: (message, data) => log(logLevels.ERROR, message, data),
  warn: (message, data) => log(logLevels.WARN, message, data),
  info: (message, data) => log(logLevels.INFO, message, data),
  debug: (message, data) => log(logLevels.DEBUG, message, data)
};

