/**
 * @description
 * This file defines the Express router for all endpoints under `/api/v1/users`.
 * It provides user profile management functionality using Clerk authentication.
 *
 * @dependencies
 * - express: The web framework for creating router instances.
 * - @/api/v1/middleware/auth.middleware: The middleware for Clerk authentication.
 * - ./users.controller: The controller containing the route handlers.
 */

import { Router } from 'express';
import { clerkAuth } from '@/api/v1/middleware/auth.middleware';
import { getUserProfileHandler, getUserWalletPhraseHandler, getUserModelsHandler } from './users.controller';

const router = Router();

/**
 * @route GET /api/v1/users/profile
 * @description Route for retrieving the current user's profile.
 * @access Protected
 *
 * @middleware
 * - `clerkAuth`: Ensures that only authenticated users can access this endpoint.
 *
 * @handler
 * - `getUserProfileHandler`: The controller function that processes the request.
 */
router.get(
  '/profile',
  clerkAuth,
  getUserProfileHandler
);

/**
 * @route GET /api/v1/users/wallet-phrases
 * @description Route for retrieving the current user's wallet mnemonic phrases.
 * @access Protected
 *
 * @middleware
 * - `clerkAuth`: Ensures that only authenticated users can access this endpoint.
 *
 * @handler
 * - `getUserWalletPhraseHandler`: The controller function that processes the request.
 */
router.get(
  '/wallet-phrases',
  clerkAuth,
  getUserWalletPhraseHandler
);

/**
 * @route GET /api/v1/users/models
 * @description Route for retrieving the current user's models.
 * @access Protected
 *
 * @middleware
 * - `clerkAuth`: Ensures that only authenticated users can access this endpoint.
 *
 * @handler
 * - `getUserModelsHandler`: The controller function that processes the request.
 */
router.get(
  '/models',
  clerkAuth,
  getUserModelsHandler
);

export default router; 