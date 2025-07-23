/**
 * @description
 * This file defines the Express router for all endpoints under `/api/v1/users`.
 * It provides user registration, login, and profile management functionality.
 *
 * @dependencies
 * - express: The web framework for creating router instances.
 * - @/api/v1/middleware/auth.middleware: The middleware for API key authentication.
 * - ./users.controller: The controller containing the route handlers.
 */

import { Router } from 'express';
import { apiKeyAuth } from '@/api/v1/middleware/auth.middleware';
import { registerUserHandler, getUserProfileHandler, getUserWalletPhraseHandler } from './users.controller';

const router = Router();

/**
 * @route POST /api/v1/users/register
 * @description Route for registering a new user (data scientist).
 * @access Public
 *
 * @handler
 * - `registerUserHandler`: The controller function that processes the registration request.
 */
router.post(
  '/register',
  registerUserHandler
);

/**
 * @route GET /api/v1/users/profile
 * @description Route for retrieving the current user's profile.
 * @access Protected
 *
 * @middleware
 * - `apiKeyAuth`: Ensures that only authenticated users can access this endpoint.
 *
 * @handler
 * - `getUserProfileHandler`: The controller function that processes the request.
 */
router.get(
  '/profile',
  apiKeyAuth,
  getUserProfileHandler
);

/**
 * @route GET /api/v1/users/wallet-phrases
 * @description Route for retrieving the current user's wallet mnemonic phrases.
 * @access Protected
 *
 * @middleware
 * - `apiKeyAuth`: Ensures that only authenticated users can access this endpoint.
 *
 * @handler
 * - `getUserWalletPhraseHandler`: The controller function that processes the request.
 */
router.get(
  '/wallet-phrases',
  apiKeyAuth,
  getUserWalletPhraseHandler
);

export default router; 