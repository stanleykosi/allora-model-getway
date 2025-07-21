/**
 * @description
 * This module implements the scheduler responsible for triggering inference requests
 * based on the epoch length of each topic. It ensures that models are called
 * periodically to submit their inferences to the Allora chain.
 *
 * @dependencies
 * - node-cron: For scheduling cron jobs.
 * - @/config: For configuration values like average block time.
 * - @/utils/logger: The application's structured logger.
 * - @/persistence/postgres.client: For database access.
 * - @/core/allora-connector/allora-connector.service: To get topic details.
 * - @/core/jobs/queue: To enqueue inference jobs.
 */

import * as cron from 'node-cron';
import { config } from '@/config';
import logger from '@/utils/logger';
import pool from '@/persistence/postgres.client';
import alloraConnectorService from '@/core/allora-connector/allora-connector.service';
import { inferenceQueue } from '@/core/jobs/queue';
import { InferenceJobData } from '../jobs/inference.processor';

const log = logger.child({ module: 'InferenceScheduler' });

class InferenceScheduler {
  // A map to keep track of running cron jobs for each topic ID.
  private topicJobs: Map<string, cron.ScheduledTask> = new Map();
  private isRunning = false;

  /**
   * Starts the main scheduler loop, which periodically synchronizes cron jobs
   * with the active topics in the database.
   */
  public start(): void {
    if (this.isRunning) {
      log.warn('Scheduler is already running.');
      return;
    }
    log.info('Starting Inference Scheduler...');
    this.isRunning = true;

    // Run the synchronization logic immediately on start, and then every 5 minutes.
    this.synchronizeJobs();
    setInterval(() => this.synchronizeJobs(), 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Fetches all active topics from the database and ensures a cron job is
   * scheduled for each one. It also cleans up jobs for topics that are no
   * longer active.
   */
  private async synchronizeJobs(): Promise<void> {
    log.info('Synchronizing inference jobs with active topics...');
    try {
      const query = 'SELECT DISTINCT topic_id FROM models WHERE is_active = true;';
      const result = await pool.query<{ topic_id: string }>(query);
      const activeTopicIds = new Set(result.rows.map(row => row.topic_id));
      log.debug({ activeTopicIds: [...activeTopicIds] }, 'Found active topics in database.');

      // --- Stop jobs for topics that are no longer active ---
      for (const topicId of this.topicJobs.keys()) {
        if (!activeTopicIds.has(topicId)) {
          log.info({ topicId }, 'Topic is no longer active. Unscheduling job.');
          const job = this.topicJobs.get(topicId);
          job?.stop();
          this.topicJobs.delete(topicId);
        }
      }

      // --- Schedule jobs for new active topics ---
      for (const topicId of activeTopicIds) {
        if (!this.topicJobs.has(topicId)) {
          log.info({ topicId }, 'Found new active topic. Scheduling job.');
          this.scheduleJobForTopic(topicId);
        }
      }

      log.info('Job synchronization complete.');

    } catch (error) {
      log.error({ err: error }, 'Failed to synchronize scheduler jobs.');
    }
  }

  /**
   * Schedules a new cron job for a specific topic based on its epoch length.
   * @param topicId The ID of the topic to schedule.
   */
  private async scheduleJobForTopic(topicId: string): Promise<void> {
    try {
      // 1. Fetch topic details from the chain to get the epoch length.
      const topicDetails = await alloraConnectorService.getTopicDetails(topicId);
      if (!topicDetails || !topicDetails.isActive) {
        log.warn({ topicId }, 'Cannot schedule job for inactive or non-existent topic.');
        return;
      }
      const { epochLength } = topicDetails; // in blocks

      // 2. Calculate the cron interval in minutes.
      const epochInSeconds = epochLength * config.AVERAGE_BLOCK_TIME_SECONDS;
      // Use Math.ceil to ensure we don't miss epochs for short intervals.
      // Cron has a minimum precision of 1 minute.
      const epochInMinutes = Math.max(1, Math.round(epochInSeconds / 60));
      const cronInterval = `*/${epochInMinutes} * * * *`;

      log.info({ topicId, epochLength, epochInMinutes, cronInterval }, 'Scheduling new cron job for topic.');

      // 3. Create and start the cron job.
      const task = cron.schedule(cronInterval, () => {
        log.info({ topicId }, `Cron job triggered. Enqueuing inference jobs for topic.`);
        this.enqueueInferenceJobs(topicId);
      }, {
        timezone: "UTC"
      });

      // 4. Store the job in the map for tracking.
      this.topicJobs.set(topicId, task);

    } catch (error) {
      log.error({ err: error, topicId }, 'Failed to schedule job for topic.');
    }
  }

  /**
   * Fetches all active models for a given topic and enqueues an inference
   * job for each one in the inference queue.
   * @param topicId The ID of the topic for which to enqueue jobs.
   */
  private async enqueueInferenceJobs(topicId: string): Promise<void> {
    try {
      const query = `
        SELECT id, webhook_url, topic_id
        FROM models
        WHERE topic_id = $1 AND is_active = true;
      `;
      const result = await pool.query<{ id: string, webhook_url: string, topic_id: string }>(query, [topicId]);

      if (result.rows.length === 0) {
        log.warn({ topicId }, 'No active models found for this topic during enqueue step.');
        return;
      }

      log.info({ topicId, count: result.rows.length }, `Enqueuing ${result.rows.length} jobs.`);

      const jobs = result.rows.map(model => {
        const jobData: InferenceJobData = {
          modelId: model.id,
          webhookUrl: model.webhook_url,
          topicId: model.topic_id
        };
        return {
          name: `inference-${model.id}-${Date.now()}`,
          data: jobData,
        };
      });

      // Use addBulk to add all jobs in one go.
      await inferenceQueue.addBulk(jobs);

    } catch (error) {
      log.error({ err: error, topicId }, 'Failed to enqueue inference jobs for topic.');
    }
  }
}

/**
 * Singleton instance of the InferenceScheduler.
 */
const inferenceScheduler = new InferenceScheduler();
export default inferenceScheduler; 