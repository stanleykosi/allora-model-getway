/**
 * @description
 * This file contains Zod schemas for validating user-related HTTP requests.
 * These schemas ensure that incoming data is properly structured and validated
 * before being processed by the controllers.
 *
 * @dependencies
 * - zod: For schema definition and validation.
 */

import { z } from 'zod';

/**
 * @schema registerUserSchema
 * @description Validates the request body for user registration.
 */
export const registerUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
  }),
});

/**
 * @schema getUserProfileSchema
 * @description Validates the request parameters for getting user profile.
 */
export const getUserProfileSchema = z.object({
  params: z.object({
    // No parameters needed for profile endpoint
  }),
}); 