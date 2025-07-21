/**
 * @description
 * This module is responsible for creating and managing the connection pool
 * to the PostgreSQL database. It ensures that the application has a resilient
 * and efficient way to interact with the database.
 *
 * @dependencies
 * - pg: The official PostgreSQL client for Node.js.
 * - @/config: The centralized configuration module to get the `DATABASE_URL`.
 * - @/utils/logger: The structured logger for logging connection events.
 *
 * @notes
 * - This module exports a single instance of the connection pool (`pool`),
 *   implementing the singleton pattern to ensure only one pool is created
 *   for the entire application lifetime.
 * - Event listeners are attached to the pool to provide real-time monitoring
 *   of the database connection status, which is crucial for debugging and
 *   maintaining reliability in a production environment.
 * - This same client is used for interacting with standard PostgreSQL tables
 *   and TimescaleDB hypertables, as TimescaleDB is an extension of PostgreSQL.
 */

import { Pool } from 'pg';
import { config } from '@/config';
import logger from '@/utils/logger';

/**
 * @description
 * A singleton instance of the PostgreSQL connection pool.
 * The pool manages multiple client connections automatically, which is more
 * efficient than opening and closing a client for every query.
 *
 * @configuration
 * - `connectionString`: The URL provided via the `DATABASE_URL` environment
 *   variable, which contains all the necessary details to connect to the database.
 */
const pool = new Pool({
  connectionString: config.DATABASE_URL,
});

/**
 * @event connect
 * @description
 * Fired when a new client is created and connected to the database backend.
 * This is useful for verifying that the application is successfully establishing
 * new connections as needed.
 */
pool.on('connect', () => {
  logger.info('Database client connected.');
});

/**
 * @event error
 * @description
 * Fired when a client in the pool encounters an error. This is a critical
 * event to monitor, as it can indicate issues with the database server itself
 * or network problems. It logs the error without crashing the application.
 */
pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected error on idle database client.');
});

/**
 * @event remove
 * @description
 * Fired when a client is removed from the pool. This typically happens after a
 * client has been idle for a certain amount of time. Logging this helps in
 * understanding the connection lifecycle.
 */
pool.on('remove', () => {
    logger.info('Database client removed from pool.');
});


logger.info('PostgreSQL connection pool initialized.');

export default pool;