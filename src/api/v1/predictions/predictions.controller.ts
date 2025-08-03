import { Request, Response } from 'express';
import { z } from 'zod';
import alloraConnectorService from '@/core/allora-connector/allora-connector.service';
import logger from '@/utils/logger';

// Validation schema for topic ID
const topicIdSchema = z.object({
  topicId: z.string().regex(/^\d+$/, 'Topic ID must be a number')
});

/**
 * Get topic details and current predictions
 */
export const getTopicDetailsHandler = async (req: Request, res: Response) => {
  try {
    const { topicId } = topicIdSchema.parse(req.params);
    const log = logger.child({ controller: 'getTopicDetailsHandler', topicId });

    log.info('Fetching topic details from Allora network');

    // Get topic details
    const topicDetails = await alloraConnectorService.getTopicDetails(topicId);

    // Get latest network inferences
    const networkInferences = await alloraConnectorService.getLatestNetworkInferences(topicId);

    const response = {
      topic: topicDetails,
      predictions: networkInferences,
      timestamp: new Date().toISOString()
    };

    log.info('Successfully retrieved topic details and predictions');
    res.json(response);

  } catch (error: any) {
    logger.error({ err: error }, 'Failed to get topic details');

    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid topic ID format' });
    }

    res.status(500).json({ error: 'Failed to retrieve topic details' });
  }
};

/**
 * Get latest network inferences for a topic
 */
export const getLatestNetworkInferencesHandler = async (req: Request, res: Response) => {
  try {
    const { topicId } = topicIdSchema.parse(req.params);
    const log = logger.child({ controller: 'getLatestNetworkInferencesHandler', topicId });

    log.info('Fetching latest network inferences');

    const inferences = await alloraConnectorService.getLatestNetworkInferences(topicId);

    const response = {
      topicId,
      inferences,
      timestamp: new Date().toISOString()
    };

    log.info('Successfully retrieved network inferences');
    res.json(response);

  } catch (error: any) {
    logger.error({ err: error }, 'Failed to get network inferences');

    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid topic ID format' });
    }

    res.status(500).json({ error: 'Failed to retrieve network inferences' });
  }
};

/**
 * Get active workers for a topic
 */
export const getActiveWorkersHandler = async (req: Request, res: Response) => {
  try {
    const { topicId } = topicIdSchema.parse(req.params);
    const log = logger.child({ controller: 'getActiveWorkersHandler', topicId });

    log.info('Fetching active workers');

    const activeInferers = await alloraConnectorService.getActiveInferers(topicId);
    const activeForecasters = await alloraConnectorService.getActiveForecasters(topicId);
    const activeReputers = await alloraConnectorService.getActiveReputers(topicId);

    const response = {
      topicId,
      workers: {
        inferers: activeInferers,
        forecasters: activeForecasters,
        reputers: activeReputers
      },
      timestamp: new Date().toISOString()
    };

    log.info('Successfully retrieved active workers');
    res.json(response);

  } catch (error: any) {
    logger.error({ err: error }, 'Failed to get active workers');

    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid topic ID format' });
    }

    res.status(500).json({ error: 'Failed to retrieve active workers' });
  }
};

/**
 * Get predictions summary for a topic
 */
export const getTopicPredictionsHandler = async (req: Request, res: Response) => {
  try {
    const { topicId } = topicIdSchema.parse(req.params);
    const log = logger.child({ controller: 'getTopicPredictionsHandler', topicId });

    log.info('Fetching predictions summary');

    // Get topic details
    const topicDetails = await alloraConnectorService.getTopicDetails(topicId);

    // Get latest network inferences
    const networkInferences = await alloraConnectorService.getLatestNetworkInferences(topicId);

    // Calculate summary statistics
    const predictions = networkInferences?.network_inferences?.inferer_values || [];
    const combinedValue = networkInferences?.network_inferences?.combined_value || '0';

    const summary = {
      topicId,
      topicMetadata: topicDetails?.creator || 'Unknown',
      lastEpoch: topicDetails?.epochLength?.toString() || '0',
      combinedPrediction: combinedValue,
      individualPredictions: predictions.map((pred: any) => ({
        worker: pred.worker,
        value: pred.value
      })),
      totalWorkers: predictions.length,
      timestamp: new Date().toISOString()
    };

    log.info('Successfully retrieved predictions summary');
    res.json(summary);

  } catch (error: any) {
    logger.error({ err: error }, 'Failed to get predictions summary');

    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid topic ID format' });
    }

    res.status(500).json({ error: 'Failed to retrieve predictions summary' });
  }
};

/**
 * Get all active topics from the Allora network
 */
export const getActiveTopicsHandler = async (req: Request, res: Response) => {
  try {
    const log = logger.child({ controller: 'getActiveTopicsHandler' });

    log.info('Fetching active topics from Allora network');

    const { topics } = await alloraConnectorService.getActiveTopics();

    const response = {
      topics,
      count: topics.length,
      timestamp: new Date().toISOString()
    };

    log.info({ topicCount: topics.length }, 'Successfully retrieved active topics');
    res.json(response);

  } catch (error: any) {
    logger.error({ err: error }, 'Failed to get active topics');
    res.status(500).json({ error: 'Failed to retrieve active topics' });
  }
}; 