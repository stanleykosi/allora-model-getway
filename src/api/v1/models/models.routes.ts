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
import { clerkAuth } from '@/api/v1/middleware/auth.middleware';
import { registerModelHandler, getModelPerformanceHandler, debugAlloradHandler, debugPerformanceHandler, deactivateModelHandler, activateModelHandler } from './models.controller';

const router = Router();

/**
 * @route POST /api/v1/models
 * @description Route for registering a new ML model.
 * @access Protected
 *
 * @middleware
 * - `clerkAuth`: Ensures that only authenticated users with a valid Clerk token can
 *   access this endpoint.
 *
 * @handler
 * - `registerModelHandler`: The controller function that processes the registration request.
 */
router.post(
  '/',
  clerkAuth,
  registerModelHandler
);


/**
 * @route GET /api/v1/models/:modelId/performance
 * @description Route for retrieving a model's on-chain performance history.
 * @access Protected
 *
 * @middleware
 * - `clerkAuth`: Ensures that only authenticated users can access this endpoint.
 *
 * @handler
 * - `getModelPerformanceHandler`: The controller function that processes the request.
 */
router.get(
  '/:modelId/performance',
  clerkAuth,
  getModelPerformanceHandler
);


/**
 * @route GET /api/v1/models/debug
 * @description Debug endpoint to test API connectivity to the Allora network.
 * @access Protected
 */
router.get(
  '/debug',
  clerkAuth,
  debugAlloradHandler
);

/**
 * @route POST /api/v1/models/:modelId/debug-performance
 * @description Debug endpoint to manually trigger performance data collection for a model.
 * @access Protected
 */
router.post(
  '/:modelId/debug-performance',
  clerkAuth,
  debugPerformanceHandler
);

/**
 * @route PUT /api/v1/models/:modelId/deactivate
 * @description Route for deactivating a user's model.
 * @access Protected
 *
 * @middleware
 * - `clerkAuth`: Ensures that only authenticated users can access this endpoint.
 *
 * @handler
 * - `deactivateModelHandler`: The controller function that processes the request.
 */
router.put(
  '/:modelId/deactivate',
  clerkAuth,
  deactivateModelHandler
);

/**
 * @route PUT /api/v1/models/:modelId/activate
 * @description Route for activating a user's model.
 * @access Protected
 *
 * @middleware
 * - `clerkAuth`: Ensures that only authenticated users can access this endpoint.
 *
 * @handler
 * - `activateModelHandler`: The controller function that processes the request.
 */
router.put(
  '/:modelId/activate',
  clerkAuth,
  activateModelHandler
);

export default router; 