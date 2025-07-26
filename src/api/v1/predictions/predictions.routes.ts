import { Router } from 'express';
import { clerkAuth } from '@/api/v1/middleware/auth.middleware';
import {
  getTopicPredictionsHandler,
  getLatestNetworkInferencesHandler,
  getActiveWorkersHandler,
  getTopicDetailsHandler,
  getActiveTopicsHandler
} from './predictions.controller';

const router = Router();

// Get topic details and current predictions
router.get('/topic/:topicId', clerkAuth, getTopicDetailsHandler);

// Get latest network inferences for a topic
router.get('/topic/:topicId/inferences', clerkAuth, getLatestNetworkInferencesHandler);

// Get active workers for a topic
router.get('/topic/:topicId/workers', clerkAuth, getActiveWorkersHandler);

// Get predictions summary for a topic
router.get('/topic/:topicId/predictions', clerkAuth, getTopicPredictionsHandler);

// Get all active topics
router.get('/topics', clerkAuth, getActiveTopicsHandler);

export default router; 