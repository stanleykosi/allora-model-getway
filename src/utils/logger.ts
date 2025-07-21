/**
 * @description
 * This module sets up and exports a centralized, structured logger instance
 * for the entire application. Structured logging (i.e., JSON format) is
 * essential for efficient parsing, querying, and analysis in modern observability
 * platforms (like Datadog, Splunk, or the ELK stack).
 *
 * @dependencies
 * - pino: A high-performance, low-overhead logger.
 * - @/config: The centralized configuration module to get the `LOG_LEVEL`.
 *
 * @notes
 * - The logger is configured as a singleton. All parts of the application
 *   should import this single `logger` instance to ensure uniform log formatting
 *   and destination.
 * - In a development environment, you might pipe the output to `pino-pretty`
 *   for more human-readable logs. For example: `npm run start | pino-pretty`.
 */

import pino from 'pino';
import { config } from '@/config';

/**
 * @description
 * A pre-configured instance of the pino logger.
 *
 * @configuration
 * - `level`: The minimum log level to output. This is controlled by the
 *   `LOG_LEVEL` environment variable, allowing for dynamic verbosity
 *   (e.g., 'debug' in development, 'info' in production).
 * - `formatters`: Customizes the log object structure. Here, we ensure
 *   the log level is represented by a `label` (e.g., "info") instead of
 *   a numeric value.
 * - `timestamp`: Generates a human-readable timestamp for each log entry.
 */
const logger = pino({
  level: config.LOG_LEVEL,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export default logger;