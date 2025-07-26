/**
 * @description
 * This file contains the controller logic for handling HTTP requests related to users.
 * Controllers are responsible for parsing requests, calling the appropriate services
 * with validated data, and formulating the HTTP response.
 *
 * @dependencies
 * - express: The web framework for handling request and response objects.
 * - @/services/user.service: The service containing the core business logic for user management.
 * - @/utils/logger: The application's structured logger.
 */

import { Request, Response } from 'express';
import userService from '@/services/user.service';
import walletService from '@/services/wallet.service';
import modelService from '@/services/model.service';
import secretsService from '@/core/secrets/secrets.service';
import logger from '@/utils/logger';

/**
 * @controller getUserProfileHandler
 * @description Handles the request to retrieve the current user's profile.
 *
 * @workflow
 * 1. Extracts the authenticated user's ID from `req.user`.
 * 2. Calls `userService.getUserById` to get the user's profile.
 * 3. If the service returns data, responds with 200 OK and the profile.
 * 4. If the service returns `null`, responds with 404 Not Found.
 * 5. Catches any other errors and responds with 500 Internal Server Error.
 *
 * @param req The Express Request object.
 * @param res The Express Response object.
 */
export const getUserProfileHandler = async (req: Request, res: Response) => {
  const log = logger.child({ controller: 'getUserProfileHandler', userId: req.user?.id });

  try {
    // Step 1: Ensure user is authenticated
    if (!req.user?.id) {
      log.warn('FATAL: getUserProfileHandler reached without an authenticated user. Check middleware order.');
      return res.status(401).json({ error: 'User not authenticated.' });
    }
    const userId = req.user.id;

    // Step 2: Call the user service
    log.info({ userId }, 'Calling UserService to get user profile.');
    const userProfile = await userService.getUserById(userId);

    // Step 3: Handle the service response
    if (!userProfile) {
      log.warn({ userId }, 'User profile not found.');
      return res.status(404).json({ error: 'User profile not found.' });
    }

    log.info({ userId }, 'Successfully retrieved user profile.');
    return res.status(200).json({
      id: userProfile.id,
      email: userProfile.email,
      created_at: userProfile.created_at,
      updated_at: userProfile.updated_at
    });

  } catch (error) {
    log.error({ err: error }, 'An unexpected error occurred in getUserProfileHandler.');
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * @controller getUserWalletPhraseHandler
 * @description Handles the request to retrieve the current user's wallet mnemonic phrase.
 * This endpoint allows users to retrieve their wallet phrase for backup purposes.
 *
 * @workflow
 * 1. Extracts the authenticated user's ID from `req.user`.
 * 2. Gets the user's profile to verify they exist.
 * 3. Retrieves the user's wallet information from the database.
 * 4. Securely retrieves the mnemonic phrase from the secrets service.
 * 5. Returns the mnemonic phrase to the user.
 *
 * @security
 * - Requires Clerk authentication
 * - Only returns the user's own wallet phrase
 * - Logs access for audit purposes
 *
 * @param req The Express Request object.
 * @param res The Express Response object.
 */
export const getUserWalletPhraseHandler = async (req: Request, res: Response) => {
  const log = logger.child({ controller: 'getUserWalletPhraseHandler', userId: req.user?.id });

  try {
    // Step 1: Ensure user is authenticated
    if (!req.user?.id) {
      log.warn('FATAL: getUserWalletPhraseHandler reached without an authenticated user. Check middleware order.');
      return res.status(401).json({ error: 'User not authenticated.' });
    }
    const userId = req.user.id;

    // Step 2: Get user profile to verify they exist
    log.info({ userId }, 'Calling UserService to get user profile.');
    const userProfile = await userService.getUserById(userId);

    if (!userProfile) {
      log.warn({ userId }, 'User profile not found.');
      return res.status(404).json({ error: 'User profile not found.' });
    }

    // Step 3: Get user's models and their wallets
    log.info({ userId }, 'Calling ModelService to get user models.');
    const userModels = await modelService.getModelsByUserId(userId);

    if (!userModels || userModels.length === 0) {
      log.warn({ userId }, 'No models found for user.');
      return res.status(404).json({ error: 'No models found for this user. Register a model first to create a wallet.' });
    }

    // Step 4: Get wallet information for each model
    const walletPhrases = [];

    for (const model of userModels) {
      log.info({ userId, modelId: model.id, walletId: model.wallet_id }, 'Retrieving wallet for model.');

      // Get wallet details
      const wallet = await walletService.getWalletById(model.wallet_id);
      if (!wallet) {
        log.warn({ userId, modelId: model.id, walletId: model.wallet_id }, 'Wallet not found for model.');
        continue;
      }

      // Securely retrieve the mnemonic phrase
      const mnemonic = await secretsService.getSecret(wallet.secret_ref);
      if (!mnemonic) {
        log.error({ userId, modelId: model.id, walletId: model.wallet_id, secretRef: wallet.secret_ref }, 'Mnemonic not found in secrets service.');
        continue;
      }

      walletPhrases.push({
        model_id: model.id,
        model_type: model.model_type,
        topic_id: model.topic_id,
        wallet_id: wallet.id,
        wallet_address: wallet.address,
        mnemonic_phrase: mnemonic,
        created_at: wallet.created_at
      });
    }

    if (walletPhrases.length === 0) {
      log.warn({ userId }, 'No valid wallet phrases found for user.');
      return res.status(404).json({ error: 'No valid wallet phrases found for this user.' });
    }

    // Step 5: Return the wallet phrases
    log.info({ userId, walletCount: walletPhrases.length }, 'Successfully retrieved wallet phrases.');
    return res.status(200).json({
      user_id: userId,
      wallets: walletPhrases,
      message: 'Store these mnemonic phrases securely. They are required to access your wallets.'
    });

  } catch (error) {
    log.error({ err: error }, 'An unexpected error occurred in getUserWalletPhraseHandler.');
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * @controller getUserModelsHandler
 * @description Handles the request to retrieve the current user's models.
 * This endpoint returns the user's models with their basic information.
 *
 * @workflow
 * 1. Extracts the authenticated user's ID from `req.user`.
 * 2. Gets the user's profile to verify they exist.
 * 3. Retrieves the user's models from the database.
 * 4. Returns the models with their basic information.
 *
 * @security
 * - Requires Clerk authentication
 * - Only returns the user's own models
 *
 * @param req The Express Request object.
 * @param res The Express Response object.
 */
export const getUserModelsHandler = async (req: Request, res: Response) => {
  const log = logger.child({ controller: 'getUserModelsHandler', userId: req.user?.id });

  try {
    // Step 1: Ensure user is authenticated
    if (!req.user?.id) {
      log.warn('FATAL: getUserModelsHandler reached without an authenticated user. Check middleware order.');
      return res.status(401).json({ error: 'User not authenticated.' });
    }
    const userId = req.user.id;

    // Step 2: Get user profile to verify they exist
    log.info({ userId }, 'Calling UserService to get user profile.');
    const userProfile = await userService.getUserById(userId);

    if (!userProfile) {
      log.warn({ userId }, 'User profile not found.');
      return res.status(404).json({ error: 'User profile not found.' });
    }

    // Step 3: Get user's models
    log.info({ userId }, 'Calling ModelService to get user models.');
    const userModels = await modelService.getModelsByUserId(userId);

    // Step 4: Return the models (empty array if no models)
    const models = userModels || [];

    log.info({ userId, modelCount: models.length }, 'Successfully retrieved user models.');
    return res.status(200).json({
      user_id: userId,
      models: models.map(model => ({
        id: model.id,
        model_type: model.model_type,
        topic_id: model.topic_id,
        webhook_url: model.webhook_url,
        max_gas_price: model.max_gas_price,
        is_active: model.is_active,
        created_at: model.created_at,
        updated_at: model.updated_at
      }))
    });

  } catch (error) {
    log.error({ err: error }, 'An unexpected error occurred in getUserModelsHandler.');
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}; 