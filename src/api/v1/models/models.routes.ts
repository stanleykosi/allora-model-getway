/**
 * @description
 * This file defines the Express router for all endpoints under `/api/v1/models`.
 * It wires up the routes to their corresponding controller handlers and applies
 * necessary middleware, such as authentication.
 *
 * @dependencies
 * - express: The web framework for creating router instances.
 * - @/api/v1/middleware/auth.middleware: The middleware for API key authentication.
 * - ./models.controller: The controller containing the route handlers.
 */

import { Router } from 'express';
import { apiKeyAuth } from '@/api/v1/middleware/auth.middleware';
import { registerModelHandler, getModelPerformanceHandler, debugAlloradHandler, debugPerformanceHandler } from './models.controller';

const router = Router();

/**
 * @route POST /api/v1/models
 * @description Route for registering a new ML model.
 * @access Protected
 *
 * @middleware
 * - `apiKeyAuth`: Ensures that only authenticated users with a valid API key can
 *   access this endpoint.
 *
 * @handler
 * - `registerModelHandler`: The controller function that processes the registration request.
 */
router.post(
  '/',
  apiKeyAuth,
  registerModelHandler
);


/**
 * @route GET /api/v1/models/:modelId/performance
 * @description Route for retrieving a model's on-chain performance history.
 * @access Protected
 *
 * @middleware
 * - `apiKeyAuth`: Ensures that only authenticated users can access this endpoint.
 *
 * @handler
 * - `getModelPerformanceHandler`: The controller function that processes the request.
 */
router.get(
  '/:modelId/performance',
  apiKeyAuth,
  getModelPerformanceHandler
);


/**
 * @route GET /api/v1/models/debug
 * @description Debug endpoint to test allorad command execution.
 * @access Protected
 */
router.get(
  '/debug',
  apiKeyAuth,
  debugAlloradHandler
);

/**
 * @route POST /api/v1/models/:modelId/debug-performance
 * @description Debug endpoint to manually trigger performance data collection for a model.
 * @access Protected
 */
router.post(
  '/:modelId/debug-performance',
  apiKeyAuth,
  debugPerformanceHandler
);

export default router; 