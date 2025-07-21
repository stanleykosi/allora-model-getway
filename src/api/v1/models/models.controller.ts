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
      modelType: validatedBody.model_type,
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
 * @description Debug endpoint to test allorad command execution.
 */
export const debugAlloradHandler = async (req: Request, res: Response) => {
  const log = logger.child({ controller: 'debugAlloradHandler' });

  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    log.info('Testing allorad command execution...');

    const isActiveCommand = 'allorad query emissions is-topic-active 1 --output json';
    const getTopicCommand = 'allorad query emissions topic 1';

    const [isActiveResult, getTopicResult] = await Promise.all([
      execAsync(isActiveCommand, {
        env: {
          ...process.env,
          ALLORA_CHAIN_ID: 'allora-testnet-1',
          ALLORA_RPC_URL: 'https://rpc.testnet.allora.network/'
        }
      }),
      execAsync(getTopicCommand, {
        env: {
          ...process.env,
          ALLORA_CHAIN_ID: 'allora-testnet-1',
          ALLORA_RPC_URL: 'https://rpc.testnet.allora.network/'
        }
      })
    ]);

    // Test the parsing logic
    const isActiveData = JSON.parse(isActiveResult.stdout);
    const isActive = typeof isActiveData === 'boolean' ? isActiveData : isActiveData.active;

    const topicLines = getTopicResult.stdout.split('\n');
    let topicId = '';
    let epochLength = 0;
    let creator = '';
    let inTopicSection = false;

    for (const line of topicLines) {
      if (line.includes('topic:')) {
        inTopicSection = true;
        continue;
      }

      if (inTopicSection) {
        if (line.includes('id:')) {
          topicId = line.split('id:')[1].trim().replace(/"/g, '');
        } else if (line.includes('epoch_length:')) {
          epochLength = parseInt(line.split('epoch_length:')[1].trim().replace(/"/g, ''), 10);
        } else if (line.includes('creator:')) {
          creator = line.split('creator:')[1].trim();
        }
      }
    }

    log.info({
      isActiveStdout: isActiveResult.stdout,
      isActiveStderr: isActiveResult.stderr,
      getTopicStdout: getTopicResult.stdout,
      getTopicStderr: getTopicResult.stderr,
      parsed: { topicId, epochLength, creator, isActive }
    }, 'Allorad command results with parsing');

    return res.status(200).json({
      success: true,
      isActive: {
        stdout: isActiveResult.stdout,
        stderr: isActiveResult.stderr,
        command: isActiveCommand
      },
      getTopic: {
        stdout: getTopicResult.stdout,
        stderr: getTopicResult.stderr,
        command: getTopicCommand
      },
      parsed: { topicId, epochLength, creator, isActive }
    });
  } catch (error: any) {
    log.error({ err: error }, 'Debug allorad command failed');
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