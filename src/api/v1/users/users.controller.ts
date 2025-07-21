/**
 * @description
 * This file contains the controller logic for handling HTTP requests related to users.
 * Controllers are responsible for parsing requests, calling the appropriate services
 * with validated data, and formulating the HTTP response.
 *
 * @dependencies
 * - express: The web framework for handling request and response objects.
 * - zod: For parsing and validating request data.
 * - @/services/user.service: The service containing the core business logic for user management.
 * - @/utils/logger: The application's structured logger.
 * - ./users.schemas: Zod schemas for request validation.
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import userService, { CreateUserData } from '@/services/user.service';
import logger from '@/utils/logger';
import { registerUserSchema } from './users.schemas';

/**
 * @controller registerUserHandler
 * @description Handles the user registration request.
 *
 * @workflow
 * 1. Validates the incoming request body against the `registerUserSchema`.
 * 2. If validation fails, responds with a 400 Bad Request error.
 * 3. Calls `userService.createUser` to perform the registration logic.
 * 4. On success, responds with a 201 Created and the new user's details including API key.
 * 5. On failure, catches errors from the service layer and responds with an
 *    appropriate HTTP status code.
 *
 * @param req The Express Request object.
 * @param res The Express Response object.
 */
export const registerUserHandler = async (req: Request, res: Response) => {
  const log = logger.child({ controller: 'registerUserHandler' });

  try {
    // Step 1: Validate request body
    const { body: validatedBody } = registerUserSchema.parse(req);
    log.info('Request body validated successfully.');

    // Step 2: Prepare data and call the user service
    const registrationData: CreateUserData = {
      email: validatedBody.email,
    };

    log.info({ email: registrationData.email }, 'Calling UserService to register the user.');
    const result = await userService.createUser(registrationData);

    // Step 3: Handle the service response
    if (result) {
      log.info({ userId: result.id }, 'User registration successful.');
      return res.status(201).json({
        success: true,
        user_id: result.id,
        email: result.email,
        api_key: result.apiKey,
        message: 'Registration successful. Use this API key to register your models.'
      });
    } else {
      log.error('UserService returned null without throwing an error.');
      return res.status(500).json({ error: 'An unexpected error occurred during user registration.' });
    }
  } catch (error: any) {
    // Handle Zod validation errors specifically
    if (error instanceof z.ZodError) {
      log.warn({ errors: error.errors }, 'User registration request validation failed.');
      return res.status(400).json({ error: 'Invalid request body', details: error.flatten() });
    }

    // Handle specific, known errors thrown by the service layer
    if (error.message.includes('already exists')) {
      log.warn({ email: req.body.email, error: error.message }, 'Registration failed due to existing email.');
      return res.status(409).json({ error: error.message });
    }

    if (error.message.includes('collision detected')) {
      log.warn({ error: error.message }, 'Registration failed due to API key collision.');
      return res.status(500).json({ error: 'Please try registration again.' });
    }

    // Handle any other unexpected errors
    log.error({ err: error }, 'An unexpected error occurred in registerUserHandler.');
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

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