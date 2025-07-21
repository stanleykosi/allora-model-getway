/**
 * @description
 * This module is responsible for loading, validating, and exporting all
 * environment variables required by the application. It uses the `dotenv`
 * library to load variables from a `.env.local` file (for local development)
 * and the `zod` library to enforce a strict schema, ensuring type safety
 * and preventing the application from running with an invalid configuration.
 *
 * @dependencies
 * - dotenv: For loading environment variables from a .env file.
 * - zod: For schema definition and validation.
 * - path: For resolving the path to the .env file correctly from the project root.
 *
 * @notes
 * - This file should be imported at the very top of the application's entry
 *   point (`src/index.ts`) to ensure variables are loaded before they are used.
 * - If validation fails, the application will throw an error and refuse to start.
 */

import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';

// Load environment variables from `.env.local` at the project root.
// This allows for easy local development overrides. `.env.local` is
// listed in .gitignore and should not be committed to version control.
// We load .env.local first so it takes precedence over a base .env file.
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

/**
 * @description
 * Defines the schema for all required and optional environment variables.
 * Zod provides static analysis and runtime validation of these variables.
 */
const envSchema = z.object({
  // Application Configuration
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),


  // Database Configuration
  DATABASE_URL: z.string().url({ message: 'DATABASE_URL must be a valid PostgreSQL connection URL.' }),

  // Job Queue (Redis) Configuration
  REDIS_URL: z.string().url({ message: 'REDIS_URL must be a valid Redis connection URL.' }),

  // Allora Network Configuration
  ALLORA_RPC_URL: z.string().url({ message: 'ALLORA_RPC_URL must be a valid RPC endpoint URL.' }),
  CHAIN_ID: z.string().min(1, { message: 'CHAIN_ID is required.' }).default('allora-testnet-1'),
  AVERAGE_BLOCK_TIME_SECONDS: z.coerce.number().int().positive().default(5),


  // Secrets Management Configuration
  TREASURY_MNEMONIC_SECRET_KEY: z.string().min(1, { message: 'TREASURY_MNEMONIC_SECRET_KEY is required.' }),

  // HashiCorp Vault Configuration (required for production deployments)
  VAULT_ADDR: z.string().url().optional(),
  VAULT_TOKEN: z.string().optional(),
  VAULT_NAMESPACE: z.string().optional(),
  VAULT_SECRET_PATH: z.string().default('secret/data/mcp'),
});

/**
 * @description
 * Parses and validates the environment variables from `process.env`.
 * The `safeParse` method is used to get a detailed result object, which
 * allows for custom error handling.
 */
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error(
    '❌ Invalid environment variables detected. Please check your .env files.',
    parsedEnv.error.flatten().fieldErrors,
  );
  // This will prevent the application from starting with an invalid configuration.
  throw new Error('Invalid or missing environment variables. See logs above.');
}

/**
 * @description
 * The validated and typed configuration object, exported for use throughout the application.
 * Using this object provides autocompletion and compile-time type checks.
 */
export const config = parsedEnv.data;