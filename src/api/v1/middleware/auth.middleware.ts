/**
 * @description
 * This file contains the middleware for authenticating API requests using a
 * secret API key. It is designed to be applied to all protected endpoints
 * to ensure that only authorized data scientists can access them.
 *
 * @dependencies
 * - express: For handling HTTP requests and responses.
 * - @/services/user.service: The user service for API key validation.
 * - @/utils/logger: The application's structured logger.
 */

import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import pool from '@/persistence/postgres.client';
import userService from '@/services/user.service';
import logger from '@/utils/logger';

// Extend the Express Request interface to include an optional 'user' property.
// This allows us to attach the authenticated user object to the request
// and access it in downstream route handlers in a type-safe manner.
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

/**
 * @description
 * Middleware to protect API routes by validating an API key provided in the
 * 'X-API-Key' header.
 *
 * @workflow
 * 1. Extracts the API key from the 'X-API-Key' request header.
 * 2. If the key is missing, it responds with a 401 Unauthorized error.
 * 3. Uses the UserService to validate the API key efficiently.
 * 4. If validation succeeds, it attaches the user's details to the request object.
 * 5. If validation fails, it responds with a 401 error.
 *
 * @security
 * - Uses bcrypt.compare for securely comparing keys, which helps defend against timing attacks.
 * - Responds with a generic "Unauthorized" message to prevent leaking information
 *   about whether a key is valid or not.
 *
 * @performance
 * This implementation uses the UserService which leverages key prefixes for
 * efficient database lookups, avoiding the need to scan all users.
 */
export const apiKeyAuth = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey || typeof apiKey !== 'string') {
    logger.warn('Authentication failed: No API key provided in "X-API-Key" header.');
    return res.status(401).json({ error: 'Unauthorized: API key is required.' });
  }

  try {
    // Use the UserService to validate the API key
    const authenticatedUser = await userService.validateApiKey(apiKey);

    if (authenticatedUser) {
      logger.debug({ userId: authenticatedUser.id }, 'API key authentication successful.');
      req.user = authenticatedUser; // Attach user information to the request object.
      return next(); // Proceed to the next middleware or route handler.
    } else {
      logger.warn('Authentication failed: Provided API key is invalid.');
      return res.status(401).json({ error: 'Unauthorized' });
    }
  } catch (error) {
    logger.error({ err: error }, 'A critical error occurred during API key authentication.');
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * @description
 * Fallback authentication middleware for backward compatibility.
 * This should be used only if the api_key_prefix column doesn't exist yet.
 * 
 * @deprecated Use apiKeyAuth instead for better performance.
 */
export const apiKeyAuthLegacy = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey || typeof apiKey !== 'string') {
    logger.warn('Authentication failed: No API key provided in "X-API-Key" header.');
    return res.status(401).json({ error: 'Unauthorized: API key is required.' });
  }

  try {
    // WARNING: Inefficient operation. See performance warning in function documentation.
    const { rows: users } = await pool.query<{ id: string; email: string; api_key_hash: string }>(
      'SELECT id, email, api_key_hash FROM users'
    );

    if (!users || users.length === 0) {
      logger.warn('Authentication failed: No users exist in the database.');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let authenticatedUser: { id: string; email: string } | null = null;

    for (const user of users) {
      // Securely compare the provided key with the stored hash.
      const match = await bcrypt.compare(apiKey, user.api_key_hash);
      if (match) {
        authenticatedUser = {
          id: user.id,
          email: user.email,
        };
        break; // Found a match, no need to check further.
      }
    }

    if (authenticatedUser) {
      logger.debug({ userId: authenticatedUser.id }, 'API key authentication successful.');
      req.user = authenticatedUser; // Attach user information to the request object.
      return next(); // Proceed to the next middleware or route handler.
    } else {
      logger.warn('Authentication failed: Provided API key is invalid.');
      return res.status(401).json({ error: 'Unauthorized' });
    }
  } catch (error) {
    logger.error({ err: error }, 'A critical error occurred during API key authentication.');
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}; 