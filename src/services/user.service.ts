/**
 * @description
 * This service handles user management operations using Clerk authentication.
 * It ensures that users are properly created and managed through Clerk OAuth.
 *
 * @dependencies
 * - @/persistence/postgres.client: The database client for user operations.
 * - @/utils/logger: The structured logger for logging operations.
 */

import pool from '@/persistence/postgres.client';
import logger from '@/utils/logger';

/**
 * @interface User
 * @description Defines the structure of a user record as returned from the database.
 */
export interface User {
  id: string;
  email: string;
  clerk_user_id: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * @interface ClerkUserData
 * @description Defines the input data for creating a user from Clerk.
 */
export interface ClerkUserData {
  clerkUserId: string;
  email: string;
}

class UserService {
  /**
   * Gets or creates a user from Clerk authentication.
   * @param data The Clerk user data.
   * @returns A promise resolving to the user or null on failure.
   */
  public async getOrCreateUserFromClerk(data: ClerkUserData): Promise<User | null> {
    const log = logger.child({
      service: 'UserService',
      method: 'getOrCreateUserFromClerk',
      clerkUserId: data.clerkUserId,
      email: data.email
    });

    try {
      log.info({ clerkUserId: data.clerkUserId, email: data.email }, 'Starting user lookup/creation');

      // First, try to find existing user by Clerk user ID
      let { rows } = await pool.query<User>(
        'SELECT * FROM users WHERE clerk_user_id = $1',
        [data.clerkUserId]
      );

      log.debug({ clerkUserId: data.clerkUserId, foundUsers: rows.length }, 'Database lookup result');

      if (rows.length > 0) {
        log.info({ userId: rows[0].id, clerkUserId: data.clerkUserId }, 'Found existing user by Clerk user ID.');
        return rows[0];
      }

      // If email is unknown@example.com, create a unique email based on Clerk user ID
      let emailToUse = data.email;
      if (emailToUse === 'unknown@example.com') {
        emailToUse = `user.${data.clerkUserId}@clerk.local`;
        log.info({ originalEmail: data.email, newEmail: emailToUse }, 'Generated unique email for user without email');
      }

      log.info({ emailToUse, clerkUserId: data.clerkUserId }, 'Creating new user');

      // Check if user already exists by email (in case of race condition)
      const { rows: existingByEmail } = await pool.query<User>(
        'SELECT * FROM users WHERE email = $1',
        [emailToUse]
      );
      
      if (existingByEmail.length > 0) {
        log.info({ userId: existingByEmail[0].id, clerkUserId: data.clerkUserId }, 'Found existing user by email, returning existing user.');
        return existingByEmail[0];
      }

      // IMPORTANT: Each Clerk user should have their own database record
      // We should NOT update existing users with different Clerk IDs
      // Create new user with Clerk user ID
      const { rows: newUserRows } = await pool.query<User>(
        'INSERT INTO users (email, clerk_user_id) VALUES ($1, $2) RETURNING *',
        [emailToUse, data.clerkUserId]
      );

      if (newUserRows.length > 0) {
        log.info({ userId: newUserRows[0].id, clerkUserId: data.clerkUserId }, 'Created new user from Clerk authentication.');
        return newUserRows[0];
      }

      log.error('Failed to create user from Clerk data.');
      return null;
    } catch (error) {
      log.error({ err: error, clerkUserId: data.clerkUserId }, 'An error occurred while getting or creating user from Clerk.');
      return null;
    }
  }

  /**
   * Retrieves a user by their ID.
   * @param userId The user's ID.
   * @returns A promise resolving to the user or null if not found.
   */
  public async getUserById(userId: string): Promise<User | null> {
    const log = logger.child({ service: 'UserService', method: 'getUserById', userId });

    try {
      const { rows } = await pool.query<User>(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );

      if (rows.length === 0) {
        log.debug('User not found.');
        return null;
      }

      return rows[0];
    } catch (error) {
      log.error({ err: error }, 'An error occurred while retrieving user.');
      return null;
    }
  }

  /**
   * Retrieves a user by their Clerk user ID.
   * @param clerkUserId The Clerk user ID.
   * @returns A promise resolving to the user or null if not found.
   */
  public async getUserByClerkId(clerkUserId: string): Promise<User | null> {
    const log = logger.child({ service: 'UserService', method: 'getUserByClerkId', clerkUserId });

    try {
      const { rows } = await pool.query<User>(
        'SELECT * FROM users WHERE clerk_user_id = $1',
        [clerkUserId]
      );

      if (rows.length === 0) {
        log.debug('User not found by Clerk user ID.');
        return null;
      }

      return rows[0];
    } catch (error) {
      log.error({ err: error }, 'An error occurred while retrieving user by Clerk ID.');
      return null;
    }
  }
}

/**
 * Singleton instance of the UserService.
 */
const userService = new UserService();
export default userService; 