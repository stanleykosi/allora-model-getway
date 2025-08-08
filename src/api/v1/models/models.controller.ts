/**
 * @description
 * This file contains the controller logic for handling HTTP requests related to models.
 * Controllers are responsible for parsing requests, calling the appropriate services
 * with validated data, and formulating the HTTP response.
 *
 * @dependencies
 * - express: The web framework for handling request and response objects.
 * - zod: For parsing and validating request data.
 * - @/services/model.service: The service containing the core business logic for model registration.
 * - @/services/performance.service: The service for retrieving model performance data.
 * - @/utils/logger: The application's structured logger.
 * - ./models.schemas: Zod schemas for request validation.
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import * as yaml from 'js-yaml';
import modelService, { ModelRegistrationData } from '@/services/model.service';
import performanceService from '@/services/performance.service';
import logger from '@/utils/logger';
import { registerModelSchema, getModelPerformanceSchema } from './models.schemas';
import pool from '@/persistence/postgres.client';

/**
 * @controller registerModelHandler
 * @description Handles the model registration request.
 *
 * @workflow
 * 1. Validates the incoming request body against the `registerModelSchema`.
 * 2. If validation fails, responds with a 400 Bad Request error.
 * 3. Extracts the authenticated user's ID from `req.user`.
 * 4. Constructs the data payload for the `ModelService`.
 * 5. Calls `modelService.registerModel` to perform the registration logic.
 * 6. On success, responds with a 201 Created and the new model's details.
 * 7. On failure, catches errors from the service layer and responds with an
 *    appropriate HTTP status code (e.g., 400 for bad input, 503 for service
 *    unavailability, 500 for other errors).
 *
 * @param req The Express Request object.
 * @param res The Express Response object.
 */
export const registerModelHandler = async (req: Request, res: Response) => {
  const log = logger.child({ controller: 'registerModelHandler', userId: req.user?.id });

  try {
    // Step 1: Validate request body
    const { body: validatedBody } = registerModelSchema.parse(req);
    log.info('Request body validated successfully.');

    // Step 2: Ensure user is authenticated (middleware should have already handled this)
    if (!req.user?.id) {
      log.warn('FATAL: registerModelHandler reached without an authenticated user. Check middleware order.');
      return res.status(401).json({ error: 'User not authenticated.' });
    }

    // Step 3: Prepare data and call the model service
    const registrationData: ModelRegistrationData = {
      userId: req.user.id,
      webhookUrl: validatedBody.webhook_url,
      topicId: validatedBody.topic_id,
      isInferer: validatedBody.is_inferer,
      isForecaster: validatedBody.is_forecaster,
      maxGasPrice: validatedBody.max_gas_price,
    };

    log.info({ topicId: registrationData.topicId }, 'Calling ModelService to register the model.');
    const result = await modelService.registerModel(registrationData);

    // Step 4: Handle the service response
    if (result) {
      log.info({ modelId: result.modelId }, 'Model registration successful.');
      return res.status(201).json(result);
    } else {
      // This case should ideally not be reached if the service layer throws errors properly.
      log.error('ModelService returned null without throwing an error.');
      return res.status(500).json({ error: 'An unexpected error occurred during model registration.' });
    }
  } catch (error: any) {
    // Handle Zod validation errors specifically
    if (error instanceof z.ZodError) {
      log.warn({ errors: error.errors }, 'Model registration request validation failed.');
      return res.status(400).json({ error: 'Invalid request body', details: error.flatten() });
    }

    // Handle specific, known errors thrown by the service layer
    if (error.message.includes('Topic not found')) {
      log.warn({ topicId: req.body.topic_id, error: error.message }, 'Registration failed due to invalid topic.');
      return res.status(400).json({ error: error.message });
    }

    if (error.message.includes('Failed to fund')) {
      log.error({ err: error }, 'Registration failed due to a treasury funding issue.');
      return res.status(503).json({ error: 'Service is temporarily unable to fund new models. Please try again later.' });
    }

    // Handle any other unexpected errors
    log.error({ err: error }, 'An unexpected error occurred in registerModelHandler.');
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};


/**
 * @controller getModelPerformanceHandler
 * @description Handles the request to retrieve historical performance data for a model.
 *
 * @workflow
 * 1. Validates the `modelId` from the URL parameters to ensure it's a UUID.
 * 2. If validation fails, responds with a 400 Bad Request error.
 * 3. Extracts the authenticated user's ID from `req.user`.
 * 4. Calls `performanceService.getPerformanceHistory` with the model and user IDs.
 * 5. If the service returns data, responds with 200 OK and the performance metrics.
 * 6. If the service returns `null` (model not found or user lacks access), responds with 404 Not Found.
 * 7. Catches any other errors and responds with 500 Internal Server Error.
 *
 * @param req The Express Request object.
 * @param res The Express Response object.
 */
export const getModelPerformanceHandler = async (req: Request, res: Response) => {
  const log = logger.child({ controller: 'getModelPerformanceHandler', userId: req.user?.id });

  try {
    // Step 1: Validate request params
    const { params } = getModelPerformanceSchema.parse(req);
    const { modelId } = params;
    log.info({ modelId }, 'Request params validated successfully.');

    // Step 2: Ensure user is authenticated
    if (!req.user?.id) {
      log.warn('FATAL: getModelPerformanceHandler reached without an authenticated user. Check middleware order.');
      return res.status(401).json({ error: 'User not authenticated.' });
    }
    const userId = req.user.id;

    // Step 3: Call the performance service
    log.info({ modelId, userId }, 'Calling PerformanceService to get performance history.');
    const performanceHistory = await performanceService.getPerformanceHistory(modelId, userId);

    // Step 4: Handle the service response
    if (performanceHistory === null) {
      log.warn({ modelId }, 'Performance history not found or access denied.');
      return res.status(404).json({ error: 'Model not found or you do not have permission to view it.' });
    }

    log.info({ modelId, count: performanceHistory.length }, 'Successfully retrieved performance history.');
    return res.status(200).json({ performance_metrics: performanceHistory });

  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      log.warn({ errors: error.errors }, 'Get performance request validation failed.');
      return res.status(400).json({ error: 'Invalid request parameters', details: error.flatten() });
    }

    // Handle any other unexpected errors
    log.error({ err: error }, 'An unexpected error occurred in getModelPerformanceHandler.');
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * @controller debugAlloradHandler
 * @description Replaced: Debug endpoint now uses connector service API calls instead of CLI.
 */
export const debugAlloradHandler = async (req: Request, res: Response) => {
  const log = logger.child({ controller: 'debugAlloradHandler' });
  try {
    const topicId = String(req.query.topic_id || '1');
    const details = await (await import('@/core/allora-connector/allora-connector.service')).default.getTopicDetails(topicId);
    const canFetch = details !== null;
    return res.status(200).json({ success: true, canFetch, topicDetails: details });
  } catch (error: any) {
    log.error({ err: error }, 'Debug handler failed');
    return res.status(500).json({ error: error.message });
  }
};

/**
 * @controller debugPerformanceHandler
 * @description Debug endpoint to manually trigger performance data collection for a model.
 */
export const debugPerformanceHandler = async (req: Request, res: Response) => {
  const log = logger.child({ controller: 'debugPerformanceHandler' });

  try {
    const { modelId } = req.params;

    if (!modelId) {
      return res.status(400).json({ error: 'Model ID is required' });
    }

    log.info({ modelId }, 'Manually triggering performance data collection');

    // Get model details from database
    const modelQuery = `
      SELECT m.id, m.topic_id, w.address as worker_address
      FROM models m
      JOIN wallets w ON m.wallet_id = w.id
      WHERE m.id = $1
    `;
    const modelResult = await pool.query(modelQuery, [modelId]);

    if (modelResult.rows.length === 0) {
      return res.status(404).json({ error: 'Model not found' });
    }

    const model = modelResult.rows[0];
    log.info({ modelId, topicId: model.topic_id, workerAddress: model.worker_address }, 'Found model details');

    // Manually trigger performance data collection
    const modelDetails = {
      modelId: model.id,
      topicId: model.topic_id,
      workerAddress: model.worker_address
    };

    await performanceService.collectPerformanceData(modelDetails);

    log.info({ modelId }, 'Performance data collection completed');

    return res.status(200).json({
      success: true,
      message: 'Performance data collection triggered successfully',
      modelDetails
    });

  } catch (error: any) {
    log.error({ err: error }, 'Debug performance collection failed');
    return res.status(500).json({ error: error.message });
  }
};

/**
 * @controller deactivateModelHandler
 * @description Handles the request to deactivate a user's model.
 * This prevents the model from being processed by schedulers.
 *
 * @security
 * - Requires API key authentication
 * - Only allows users to deactivate their own models
 * - Logs the action for audit purposes
 *
 * @param req The Express Request object.
 * @param res The Express Response object.
 */
export const deactivateModelHandler = async (req: Request, res: Response) => {
  const log = logger.child({ controller: 'deactivateModelHandler', userId: req.user?.id });

  try {
    // Step 1: Ensure user is authenticated
    if (!req.user?.id) {
      log.warn('FATAL: deactivateModelHandler reached without an authenticated user. Check middleware order.');
      return res.status(401).json({ error: 'User not authenticated.' });
    }
    const userId = req.user.id;
    const { modelId } = req.params;

    // Step 2: Verify the model belongs to the user
    const modelQuery = `
      SELECT id, topic_id, is_active, created_at
      FROM models
      WHERE id = $1 AND user_id = $2
    `;
    const modelResult = await pool.query(modelQuery, [modelId, userId]);

    if (modelResult.rows.length === 0) {
      log.warn({ userId, modelId }, 'Model not found or does not belong to user.');
      return res.status(404).json({ error: 'Model not found or access denied.' });
    }

    const model = modelResult.rows[0];

    if (!model.is_active) {
      log.info({ userId, modelId }, 'Model is already deactivated.');
      return res.status(200).json({
        message: 'Model is already deactivated.',
        model: {
          id: model.id,
          topic_id: model.topic_id,
          is_active: false
        }
      });
    }

    // Step 3: Deactivate the model
    const deactivateQuery = `
      UPDATE models 
      SET is_active = false, updated_at = NOW() 
      WHERE id = $1 AND user_id = $2
      RETURNING id, topic_id, is_active, updated_at
    `;
    const deactivateResult = await pool.query(deactivateQuery, [modelId, userId]);

    log.info({ userId, modelId, topicId: model.topic_id }, 'Model deactivated successfully.');

    return res.status(200).json({
      message: 'Model deactivated successfully.',
      model: deactivateResult.rows[0]
    });

  } catch (error) {
    log.error({ err: error }, 'An unexpected error occurred in deactivateModelHandler.');
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * @controller activateModelHandler
 * @description Handles the request to activate a user's model.
 * This allows the model to be processed by schedulers again.
 *
 * @security
 * - Requires API key authentication
 * - Only allows users to activate their own models
 * - Logs the action for audit purposes
 *
 * @param req The Express Request object.
 * @param res The Express Response object.
 */
export const activateModelHandler = async (req: Request, res: Response) => {
  const log = logger.child({ controller: 'activateModelHandler', userId: req.user?.id });

  try {
    // Step 1: Ensure user is authenticated
    if (!req.user?.id) {
      log.warn('FATAL: activateModelHandler reached without an authenticated user. Check middleware order.');
      return res.status(401).json({ error: 'User not authenticated.' });
    }
    const userId = req.user.id;
    const { modelId } = req.params;

    // Step 2: Verify the model belongs to the user
    const modelQuery = `
      SELECT id, topic_id, is_active, created_at
      FROM models
      WHERE id = $1 AND user_id = $2
    `;
    const modelResult = await pool.query(modelQuery, [modelId, userId]);

    if (modelResult.rows.length === 0) {
      log.warn({ userId, modelId }, 'Model not found or does not belong to user.');
      return res.status(404).json({ error: 'Model not found or access denied.' });
    }

    const model = modelResult.rows[0];

    if (model.is_active) {
      log.info({ userId, modelId }, 'Model is already active.');
      return res.status(200).json({
        message: 'Model is already active.',
        model: {
          id: model.id,
          topic_id: model.topic_id,
          is_active: true
        }
      });
    }

    // Step 3: Activate the model
    const activateQuery = `
      UPDATE models 
      SET is_active = true, updated_at = NOW() 
      WHERE id = $1 AND user_id = $2
      RETURNING id, topic_id, is_active, updated_at
    `;
    const activateResult = await pool.query(activateQuery, [modelId, userId]);

    log.info({ userId, modelId, topicId: model.topic_id }, 'Model activated successfully.');

    return res.status(200).json({
      message: 'Model activated successfully.',
      model: activateResult.rows[0]
    });

  } catch (error) {
    log.error({ err: error }, 'An unexpected error occurred in activateModelHandler.');
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}; 