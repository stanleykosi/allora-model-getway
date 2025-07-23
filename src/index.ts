/**
 * @description
 * This is the main entry point for the Allora HTTP Server application.
 * Its primary responsibilities are to initialize the environment,
 * start the Express server, and handle graceful shutdown signals.
 *
 * @execution
 * This script is intended to be run via `ts-node` for development
 * or `node` after compilation to JavaScript.
 *
 * @dependencies
 * - @/config: Loads and validates all environment variables. Must be imported first.
 * - @/api/server: The configured Express application instance.
 * - @/utils/logger: The application-wide structured logger.
 * - @/core/scheduler/inference.scheduler: The scheduler for inference jobs.
 * - @/core/scheduler/performance.scheduler: The scheduler for performance monitoring jobs.
 */

import { config } from '@/config'; // Must be the first import
import app from './api/server';
import logger from './utils/logger';
import inferenceScheduler from './core/scheduler/inference.scheduler';
import performanceScheduler from './core/scheduler/performance.scheduler';
import secretsService from './core/secrets/secrets.service';

const PORT = config.PORT;

/**
 * @function loadTreasuryMnemonic
 * @description
 * Loads the treasury mnemonic from Vault or environment variables into the secrets store.
 * This is required for the model registration process to work.
 */
const loadTreasuryMnemonic = async () => {
  try {
    // First try to load from Vault
    const vaultMnemonic = await secretsService.getSecret(config.TREASURY_MNEMONIC_SECRET_KEY);

    if (vaultMnemonic) {
      logger.info('✅ Treasury mnemonic loaded from Vault');
      return;
    }

    // Fallback to environment variable if not in Vault
    const envMnemonic = process.env.TREASURY_MNEMONIC;
    if (envMnemonic) {
      await secretsService.storeSecret(config.TREASURY_MNEMONIC_SECRET_KEY, envMnemonic);
      logger.info('✅ Treasury mnemonic loaded from environment variables and stored in Vault');
    } else {
      logger.warn('⚠️  Treasury mnemonic not found in Vault or environment variables. Model registration will fail.');
    }
  } catch (error) {
    logger.error({ err: error }, '❌ Failed to load treasury mnemonic');
    throw error;
  }
};

/**
 * @function startServer
 * @description
 * Starts the Express server on the configured port and logs the status.
 * It also starts all required schedulers for background jobs.
 */
const startServer = async () => {
  try {
    // Load treasury mnemonic before starting the server
    await loadTreasuryMnemonic();

    app.listen(PORT, () => {
      logger.info(`🚀 Server is running on http://localhost:${PORT}`);

      // Start the inference job scheduler after the server is up.
      inferenceScheduler.start();
      // Start the performance monitoring scheduler.
      performanceScheduler.start();
    });
  } catch (error) {
    logger.fatal({ err: error }, '❌ Failed to start the server');
    process.exit(1);
  }
};

startServer().catch((error) => {
  logger.fatal({ err: error }, '❌ Failed to start server');
  process.exit(1);
});

// --- Graceful Shutdown Logic (Placeholder) ---
// In a production setup, you would add logic here to handle signals like
// SIGTERM and SIGINT to gracefully close database connections, stop accepting
// new requests, and finish processing existing jobs before exiting.

process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  // Add server shutdown logic here
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  // Add server shutdown logic here
  process.exit(0);
}); 