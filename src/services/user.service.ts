/**
 * @description
 * This service handles user management operations, including API key generation
 * and validation. It ensures that API keys are generated with unique prefixes
 * for efficient database lookups.
 *
 * @dependencies
 * - bcrypt: For hashing API keys securely.
 * - crypto: For generating cryptographically secure random API keys.
 * - @/persistence/postgres.client: The database client for user operations.
 * - @/utils/logger: The structured logger for logging operations.
 */

import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import pool from '@/persistence/postgres.client';
import logger from '@/utils/logger';

/**
 * @interface User
 * @description Defines the structure of a user record as returned from the database.
 */
export interface User {
  id: string;
  email: string;
  api_key_hash: string;
  api_key_prefix?: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * @interface CreateUserData
 * @description Defines the input data required to create a new user.
 */
export interface CreateUserData {
  email: string;
  apiKey?: string; // Optional - will generate if not provided
}

/**
 * @interface CreateUserResult
 * @description Defines the successful output of user creation.
 */
export interface CreateUserResult {
  id: string;
  email: string;
  apiKey: string; // The plaintext API key (only returned once)
}

class UserService {
  /**
   * Generates a cryptographically secure API key with a unique prefix.
   * @returns A 32-character API key
   */
  private generateApiKey(): string {
    return randomBytes(16).toString('hex');
  }

  /**
   * Creates a new user with an API key.
   * @param data The user creation data.
   * @returns A promise resolving to the creation result or null on failure.
   */
  public async createUser(data: CreateUserData): Promise<CreateUserResult | null> {
    const log = logger.child({ service: 'UserService', method: 'createUser', email: data.email });

    try {
      // Generate API key if not provided
      const apiKey = data.apiKey || this.generateApiKey();
      const keyPrefix = apiKey.substring(0, 8);

      // Hash the API key for secure storage
      const saltRounds = 12;
      const apiKeyHash = await bcrypt.hash(apiKey, saltRounds);

      // Check if email already exists
      const existingUser = await pool.query<User>(
        'SELECT id FROM users WHERE email = $1',
        [data.email]
      );

      if (existingUser.rows.length > 0) {
        log.warn('User creation failed: Email already exists.');
        throw new Error('User with this email already exists.');
      }

      // Check if key prefix already exists (should be unique)
      const existingPrefix = await pool.query<User>(
        'SELECT id FROM users WHERE api_key_prefix = $1',
        [keyPrefix]
      );

      if (existingPrefix.rows.length > 0) {
        log.warn('User creation failed: API key prefix collision.');
        throw new Error('API key collision detected. Please try again.');
      }

      // Insert the new user
      const query = `
        INSERT INTO users (email, api_key_hash, api_key_prefix)
        VALUES ($1, $2, $3)
        RETURNING id, email;
      `;
      const values = [data.email, apiKeyHash, keyPrefix];

      const result = await pool.query<User>(query, values);
      const newUser = result.rows[0];

      if (!newUser) {
        log.error('User creation failed: Database insertion failed.');
        throw new Error('Failed to create user.');
      }

      log.info({ userId: newUser.id }, 'User created successfully.');

      return {
        id: newUser.id,
        email: newUser.email,
        apiKey, // Return the plaintext key only once
      };
    } catch (error) {
      log.error({ err: error }, 'An unexpected error occurred during user creation.');
      return null;
    }
  }

  /**
   * Validates an API key and returns the associated user.
   * @param apiKey The API key to validate.
   * @returns A promise resolving to the user or null if invalid.
   */
  public async validateApiKey(apiKey: string): Promise<{ id: string; email: string } | null> {
    const log = logger.child({ service: 'UserService', method: 'validateApiKey' });

    try {
      const keyPrefix = apiKey.substring(0, 8);

      // Query for user with matching prefix
      const { rows: users } = await pool.query<User>(
        'SELECT id, email, api_key_hash FROM users WHERE api_key_prefix = $1',
        [keyPrefix]
      );

      if (!users || users.length === 0) {
        log.debug('No user found with matching key prefix.');
        return null;
      }

      // Since prefixes should be unique, we expect only one user
      const user = users[0];

      // Securely compare the provided key with the stored hash
      const match = await bcrypt.compare(apiKey, user.api_key_hash);

      if (match) {
        log.debug({ userId: user.id }, 'API key validation successful.');
        return {
          id: user.id,
          email: user.email,
        };
      } else {
        log.debug('API key validation failed: Hash mismatch.');
        return null;
      }
    } catch (error) {
      log.error({ err: error }, 'An error occurred during API key validation.');
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
}

/**
 * Singleton instance of the UserService.
 */
const userService = new UserService();
export default userService; 