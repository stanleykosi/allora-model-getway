/**
 * @description
 * This module configures and initializes the BullMQ job queuing system, which is
 * essential for handling asynchronous, long-running tasks like submitting
 * inferences to the blockchain. It decouples these tasks from the synchronous
 * API request/response cycle, improving reliability and scalability.
 *
 * @dependencies
 * - bullmq: The job queue library.
 * - ioredis: The Redis client used by BullMQ.
 * - @/config: For the Redis connection URL.
 * - @/utils/logger: For structured logging of queue events.
 * - ./inference.processor: The function that will process jobs from this queue.
 */

import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '@/config';
import logger from '@/utils/logger';
import inferenceProcessor, { InferenceJobData } from './inference.processor';

const log = logger.child({ module: 'JobQueue' });

// --- Connection ---
// Create a new Redis connection instance. BullMQ requires this for persistence.
// It's recommended to use a new connection for BullMQ to avoid conflicts.
const connection = new IORedis(config.REDIS_URL, {
  maxRetriesPerRequest: null, // Let BullMQ handle retries
});

connection.on('connect', () => log.info('Successfully connected to Redis for BullMQ.'));
connection.on('error', (err) => log.error({ err }, 'Redis connection error for BullMQ.'));

// --- Queue Definition ---
// This queue will handle all inference submission jobs.
export const INFERENCE_QUEUE_NAME = 'inference-submission';
export const inferenceQueue = new Queue<InferenceJobData>(INFERENCE_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 3, // Retry failed jobs up to 3 times
    backoff: {
      type: 'exponential',
      delay: 5000, // Wait 5s before the first retry, then 10s, 20s
    },
  },
});

log.info(`Job queue "${INFERENCE_QUEUE_NAME}" initialized.`);


// --- Worker Definition ---
// A worker is a process that listens to a queue and executes jobs.
// You can run multiple worker processes to scale up processing capacity.
const worker = new Worker<InferenceJobData>(INFERENCE_QUEUE_NAME, inferenceProcessor, {
  connection,
  concurrency: config.JOB_CONCURRENCY,
  limiter: {
    max: config.JOB_RATE_MAX,
    duration: config.JOB_RATE_DURATION,
  },
});

// --- Worker Event Listeners for Monitoring ---
worker.on('completed', (job, returnValue) => {
  log.info({ jobId: job.id, returnValue }, `Job completed successfully.`);
});

worker.on('failed', (job, err) => {
  log.error({ jobId: job?.id, err }, `Job failed.`);
});

worker.on('error', err => {
  log.error({ err }, 'A BullMQ worker experienced a critical error.');
});

log.info(`Job worker for "${INFERENCE_QUEUE_NAME}" is running.`);

// Graceful shutdown
const gracefulShutdown = async () => {
  log.info('Closing job queue worker and connection...');
  await worker.close();
  await inferenceQueue.close();
  await connection.quit();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown); 