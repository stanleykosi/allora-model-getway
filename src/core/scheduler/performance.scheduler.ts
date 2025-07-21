/**
 * @description
 * This module implements the scheduler responsible for periodically fetching and
 * storing on-chain performance metrics for all active models. This ensures that
 * data scientists have access to up-to-date performance history.
 *
 * @dependencies
 * - node-cron: For scheduling cron jobs.
 * - @/utils/logger: The application's structured logger.
 * - @/persistence/postgres.client: For database access to fetch active models.
 * - @/services/performance.service: The service that handles the logic for
 *   collecting and storing performance data.
 */

import * as cron from 'node-cron';
import logger from '@/utils/logger';
import pool from '@/persistence/postgres.client';
import performanceService, { ModelDetailsForPerformance } from '@/services/performance.service';

const log = logger.child({ module: 'PerformanceScheduler' });

/**
 * @interface ActiveModelForPerf
 * @description Defines the structure of the data queried from the database.
 */
interface ActiveModelForPerf {
  modelId: string;
  topicId: string;
  workerAddress: string;
}

class PerformanceScheduler {
  private cronJob: cron.ScheduledTask | null = null;
  private isRunning = false;

  /**
   * Starts the performance collection scheduler.
   * The job is scheduled to run every 15 minutes.
   */
  public start(): void {
    if (this.isRunning) {
      log.warn('PerformanceScheduler is already running.');
      return;
    }
    log.info('Starting Performance Scheduler...');
    this.isRunning = true;

    // Schedule the task to run every 15 minutes.
    // The cron expression '*/15 * * * *' means "at every 15th minute".
    this.cronJob = cron.schedule('*/15 * * * *', () => {
      log.info('Cron job triggered. Starting collection of performance data.');
      this.collectAllModelsPerformance();
    }, {
      timezone: "UTC"
    }
    );
  }

  /**
   * Stops the scheduler. This is important for graceful shutdown.
   */
  public stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.isRunning = false;
      log.info('Performance Scheduler stopped.');
    }
  }

  /**
   * Fetches all active models and triggers the performance data collection
   * process for each one.
   */
  private async collectAllModelsPerformance(): Promise<void> {
    log.info('Fetching all active models to collect performance data.');
    try {
      const query = `
        SELECT
          m.id AS "modelId",
          m.topic_id AS "topicId",
          w.address AS "workerAddress"
        FROM models m
        JOIN wallets w ON m.wallet_id = w.id
        WHERE m.is_active = true;
      `;
      const result = await pool.query<ActiveModelForPerf>(query);
      const activeModels = result.rows;

      if (activeModels.length === 0) {
        log.info('No active models found. Nothing to process.');
        return;
      }

      log.info(`Found ${activeModels.length} active models. Beginning performance collection for each.`);

      // Process each model sequentially to avoid overwhelming the RPC node.
      // For a large number of models, a queue-based approach would be better,
      // but this is sufficient for now.
      for (const model of activeModels) {
        const modelDetails: ModelDetailsForPerformance = {
          modelId: model.modelId,
          topicId: model.topicId,
          workerAddress: model.workerAddress,
        };
        // The service method handles its own error logging, so we don't need to wrap this
        // in a try/catch block here. This prevents one failed model from stopping the loop.
        await performanceService.collectPerformanceData(modelDetails);
      }

      log.info('Finished collecting performance data for all active models.');

    } catch (error) {
      log.error({ err: error }, 'A critical error occurred while fetching active models for performance collection.');
    }
  }
}

/**
 * Singleton instance of the PerformanceScheduler.
 */
const performanceScheduler = new PerformanceScheduler();
export default performanceScheduler; 