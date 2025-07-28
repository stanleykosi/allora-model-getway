/**
 * @description
 * This file contains the middleware for authenticating API requests using Clerk JWT tokens.
 * It is designed to be applied to all protected endpoints to ensure that only
 * authenticated users can access them.
 *
 * @dependencies
 * - express: For handling HTTP requests and responses.
 * - @clerk/backend: For JWT token verification.
 * - @/services/user.service: The user service for user management.
 * - @/utils/logger: The application's structured logger.
 */

import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@clerk/backend';
import userService from '@/services/user.service';
import logger from '@/utils/logger';
import { config } from '@/config';
import { logSecurityEvent, logAuthSuccess, SecurityEventType } from './security.middleware';

// Extend the Express Request interface to include an optional 'user' property.
// This allows us to attach the authenticated user object to the request
// and access it in downstream route handlers in a type-safe manner.
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        clerkUserId: string;
      };
    }
  }
}

/**
 * @description
 * Middleware to protect API routes by validating Clerk JWT tokens provided in the
 * 'Authorization' header as 'Bearer <token>'.
 *
 * @workflow
 * 1. Extracts the JWT token from the 'Authorization' request header.
 * 2. If the token is missing, it responds with a 401 Unauthorized error.
 * 3. Uses Clerk's verifyToken to validate the JWT token.
 * 4. If validation succeeds, it attaches the user's details to the request object.
 * 5. If validation fails, it responds with a 401 error.
 *
 * @security
 * - Uses Clerk's verifyToken for secure JWT validation.
 * - Responds with a generic "Unauthorized" message to prevent leaking information.
 */
export const clerkAuth = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  const authHeader = req.headers.authorization;

  logger.info({
    authHeader: authHeader,
    hasAuthHeader: !!authHeader,
    startsWithBearer: authHeader?.startsWith('Bearer '),
    headerLength: authHeader?.length,
    userAgent: req.headers['user-agent'],
    referer: req.headers['referer'],
    origin: req.headers['origin']
  }, 'Received authorization header');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('Authentication failed: No Bearer token provided in Authorization header.');
    logSecurityEvent(SecurityEventType.AUTHENTICATION_FAILURE, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      reason: 'MISSING_BEARER_TOKEN'
    });
    return res.status(401).json({ error: 'Unauthorized: Bearer token is required.' });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  logger.debug({
    tokenLength: token.length,
    tokenPreview: token.substring(0, 20) + '...',
    isJWTFormat: token.split('.').length === 3
  }, 'Extracted token from header');

  try {
    // Verify the JWT token using Clerk
    // SECURITY FIX: Use validated config instead of direct process.env access
    const payload = await verifyToken(token, {
      secretKey: config.CLERK_SECRET_KEY,
    });

    if (!payload || !payload.sub) {
      logger.warn('Authentication failed: Invalid JWT token payload.');
      logSecurityEvent(SecurityEventType.INVALID_TOKEN, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.url,
        reason: 'INVALID_JWT_PAYLOAD'
      });
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get the full user profile from Clerk using REST API
    let email = 'unknown@example.com';
    try {
      logger.debug({ clerkUserId: payload.sub }, 'Attempting to fetch user from Clerk API');

      const response = await fetch(`https://api.clerk.com/v1/users/${payload.sub}`, {
        headers: {
          'Authorization': `Bearer ${config.CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      logger.debug({
        clerkUserId: payload.sub,
        status: response.status,
        statusText: response.statusText
      }, 'Clerk API response received');

      if (response.ok) {
        const clerkUser = await response.json() as any;

        logger.debug({
          clerkUserId: payload.sub,
          hasEmailAddresses: !!clerkUser.email_addresses,
          emailAddressesLength: clerkUser.email_addresses?.length
        }, 'Clerk user data received');

        if (clerkUser.email_addresses && clerkUser.email_addresses.length > 0) {
          email = clerkUser.email_addresses[0].email_address;
          logger.info({
            clerkUserId: payload.sub,
            email: email,
            emailVerified: clerkUser.email_addresses[0].verification?.status
          }, 'Retrieved user email from Clerk API');
        } else {
          logger.warn({ clerkUserId: payload.sub }, 'No email addresses found for user');
        }
      } else {
        const errorText = await response.text();
        logger.error({
          clerkUserId: payload.sub,
          status: response.status,
          statusText: response.statusText,
          errorText: errorText
        }, 'Failed to get user from Clerk API');
      }
    } catch (error) {
      logger.error({ err: error, clerkUserId: payload.sub }, 'Failed to get user from Clerk API');
      // Fall back to unknown email
    }

    // Get or create user in our database
    const user = await userService.getOrCreateUserFromClerk({
      clerkUserId: payload.sub,
      email: email,
    });

    if (user) {
      logger.debug({ userId: user.id, clerkUserId: payload.sub }, 'Clerk authentication successful.');

      // Log successful authentication for security monitoring
      logAuthSuccess(user.id, user.email, req);

      req.user = {
        id: user.id,
        email: user.email,
        clerkUserId: payload.sub,
      };
      return next();
    } else {
      logger.warn('Authentication failed: Could not get or create user from Clerk.');
      return res.status(401).json({ error: 'Unauthorized' });
    }
  } catch (error) {
    logger.error({ err: error }, 'A critical error occurred during Clerk authentication.');
    logSecurityEvent(SecurityEventType.AUTHENTICATION_FAILURE, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      error: error instanceof Error ? error.message : 'Unknown error',
      reason: 'AUTH_PROCESSING_ERROR'
    });
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

/**
 * @description
 * Legacy API key authentication middleware for backward compatibility.
 * This should be used only during the transition period.
 * 
 * @deprecated Use clerkAuth instead for better security and user experience.
 */
export const apiKeyAuth = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  logger.warn('API key authentication is deprecated. Please use Clerk authentication.');
  return res.status(401).json({ error: 'API key authentication is no longer supported. Please use Clerk authentication.' });
}; 