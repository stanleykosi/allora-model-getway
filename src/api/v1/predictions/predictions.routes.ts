import { Router } from 'express';
import { apiKeyAuth } from '@/api/v1/middleware/auth.middleware';
import {
  getTopicPredictionsHandler,
  getLatestNetworkInferencesHandler,
  getActiveWorkersHandler,
  getTopicDetailsHandler,
  getActiveTopicsHandler
} from './predictions.controller';

const router = Router();

// Get topic details and current predictions
router.get('/topic/:topicId', apiKeyAuth, getTopicDetailsHandler);

// Get latest network inferences for a topic
router.get('/topic/:topicId/inferences', apiKeyAuth, getLatestNetworkInferencesHandler);

// Get active workers for a topic
router.get('/topic/:topicId/workers', apiKeyAuth, getActiveWorkersHandler);

// Get predictions summary for a topic
router.get('/topic/:topicId/predictions', apiKeyAuth, getTopicPredictionsHandler);

// Get all active topics
router.get('/topics', apiKeyAuth, getActiveTopicsHandler);

export default router; 