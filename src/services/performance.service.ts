/**
 * @description
 * This service is responsible for handling the collection and retrieval of
 * on-chain performance metrics for registered models. It interacts with the
 * Allora Connector to fetch data from the chain and with the persistence layer
 * to store and query this time-series data.
 *
 * @dependencies
 * - @/utils/logger: For structured logging.
 * - @/persistence/postgres.client: For database interactions.
 * - @/core/allora-connector/allora-connector.service: For fetching on-chain data.
 */

import logger from '@/utils/logger';
import pool from '@/persistence/postgres.client';
import alloraConnectorService from '@/core/allora-connector/allora-connector.service';

/**
 * @interface PerformanceMetric
 * @description Defines the structure for a single performance data point.
 */
export interface PerformanceMetric {
  timestamp: Date;
  ema_score: string;
}

/**
 * @interface ModelDetailsForPerformance
 * @description Defines the data needed by the service to collect performance data.
 */
export interface ModelDetailsForPerformance {
  modelId: string;
  topicId: string;
  workerAddress: string;
}

class PerformanceService {
  /**
   * Fetches the latest on-chain performance data for a given model and stores
   * it in the time-series database. This method is intended to be called
   * periodically by a scheduler.
   *
   * @param modelDetails The necessary details of the model to query.
   * @returns A promise that resolves when the operation is complete.
   */
  public async collectPerformanceData(modelDetails: ModelDetailsForPerformance): Promise<void> {
    const { modelId, topicId, workerAddress } = modelDetails;
    const log = logger.child({
      service: 'PerformanceService',
      method: 'collectPerformanceData',
      modelId,
      topicId,
    });

    try {
      log.info('Fetching worker performance from the chain.');
      const performance = await alloraConnectorService.getWorkerPerformance(topicId, workerAddress);

      if (!performance) {
        log.warn('Could not retrieve performance data for worker. Skipping storage.');
        return;
      }

      const { emaScore } = performance;

      log.info({ emaScore }, 'Storing new performance metric in database.');

      const query = `
        INSERT INTO performance_metrics (model_id, timestamp, ema_score)
        VALUES ($1, NOW(), $2)
        ON CONFLICT (model_id, timestamp) DO NOTHING;
      `;
      await pool.query(query, [modelId, emaScore]);

      log.info('Successfully stored performance metric.');
    } catch (error) {
      log.error({ err: error }, 'An error occurred while collecting performance data.');
      // We don't re-throw here because a single failure should not stop the scheduler
      // from processing other models. The error is logged for monitoring.
    }
  }

  /**
   * Retrieves the historical performance metrics for a specific model.
   * Includes a security check to ensure the requesting user owns the model.
   *
   * @param modelId The ID of the model whose history is being requested.
   * @param userId The ID of the user making the request.
   * @returns A promise that resolves to an array of performance metrics, or null if not found/no access.
   */
  public async getPerformanceHistory(modelId: string, userId: string): Promise<PerformanceMetric[] | null> {
    const log = logger.child({
      service: 'PerformanceService',
      method: 'getPerformanceHistory',
      modelId,
      userId,
    });

    try {
      // Security Check: Verify that the user owns the model they are querying.
      const ownershipCheckQuery = 'SELECT id FROM models WHERE id = $1 AND user_id = $2';
      const ownershipResult = await pool.query(ownershipCheckQuery, [modelId, userId]);

      if (ownershipResult.rows.length === 0) {
        log.warn('Access denied. User does not own the requested model.');
        return null; // Return null to indicate "Not Found" or "Forbidden"
      }

      log.info('User ownership verified. Fetching performance history.');

      const historyQuery = `
        SELECT timestamp, ema_score
        FROM performance_metrics
        WHERE model_id = $1
        ORDER BY timestamp DESC;
      `;
      const historyResult = await pool.query<PerformanceMetric>(historyQuery, [modelId]);

      return historyResult.rows;
    } catch (error) {
      log.error({ err: error }, 'An error occurred while retrieving performance history.');
      throw error; // Re-throw to be handled by the controller
    }
  }
}

/**
 * Singleton instance of the PerformanceService.
 */
const performanceService = new PerformanceService();
export default performanceService; 