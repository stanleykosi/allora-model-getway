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
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),

  // Database Configuration
  DATABASE_URL: z.string().url({ message: 'DATABASE_URL must be a valid PostgreSQL connection URL.' }),
  DB_CA_CERT: z.string().optional(), // CA certificate for SSL validation

  // Job Queue (Redis) Configuration
  REDIS_URL: z.string().url({ message: 'REDIS_URL must be a valid Redis connection URL.' }),

  // Allora Network Configuration
  // Comma-separated lists to support multi-node failover
  ALLORA_API_URLS: z.string().min(1, { message: 'At least one Allora API URL is required (comma-separated).' }),
  ALLORA_RPC_URLS: z.string().min(1, { message: 'At least one Allora RPC URL is required (comma-separated).' }),
  CHAIN_ID: z.string().min(1, { message: 'CHAIN_ID is required.' }).default('allora-testnet-1'),
  AVERAGE_BLOCK_TIME_SECONDS: z.coerce.number().int().positive().default(5),

  // Secrets Management Configuration
  TREASURY_MNEMONIC_SECRET_KEY: z.string().min(1, { message: 'TREASURY_MNEMONIC_SECRET_KEY is required.' }),

  // HashiCorp Vault Configuration (required for production deployments)
  VAULT_ADDR: z.string().url().optional(),
  VAULT_TOKEN: z.string().optional(),
  VAULT_NAMESPACE: z.string().optional(),
  VAULT_SECRET_PATH: z.string().default('secret/data/mcp'),

  // Clerk Authentication Configuration
  VITE_CLERK_PUBLISHABLE_KEY: z.string().min(1, { message: 'VITE_CLERK_PUBLISHABLE_KEY is required for authentication.' }),
  CLERK_SECRET_KEY: z.string().min(1, { message: 'CLERK_SECRET_KEY is required for backend authentication.' }),

  // CORS Configuration
  ALLOWED_ORIGINS: z.string().optional(),

  // Railway Configuration
  RAILWAY_PUBLIC_DOMAIN: z.string().optional(),

  // Rate Limiting Configuration
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000), // 15 minutes
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100), // Max requests per window

  // Worker payload formatting behavior
  BOUNDED_EXP40DEC_PRECISION: z.coerce.number().int().positive().default(18),
  INVALID_MODEL_OUTPUT_POLICY: z.enum(['throw', 'skip', 'zero']).default('throw'),

  // Testing/Dev toggles
  DRY_RUN_TRANSACTIONS: z.coerce.boolean().default(false),

  // Active topics discovery (fallback) configuration
  ACTIVE_TOPICS_SCAN_START_ID: z.coerce.number().int().positive().default(1),
  ACTIVE_TOPICS_SCAN_END_ID: z.coerce.number().int().positive().default(100),
  ACTIVE_TOPICS_CACHE_MS: z.coerce.number().int().positive().default(60000),
  ACTIVE_TOPICS_FALLBACK_SCAN: z.coerce.boolean().default(true),

  // Fast broadcast configuration
  SUBMISSION_FIXED_GAS_LIMIT: z.coerce.number().int().positive().default(180000),
  JOBS_FAST_BROADCAST: z.coerce.boolean().default(false),

  // Submission gating configuration
  JOBS_BYPASS_CAN_SUBMIT: z.coerce.boolean().default(false),

  // Node health monitoring
  ENABLE_NODE_HEALTH_MONITOR: z.coerce.boolean().default(true),
  NODE_HEALTH_CHECK_MS: z.coerce.number().int().positive().default(30000),
  NODE_HEALTH_MAX_FAILS: z.coerce.number().int().positive().default(2),

  // Job queue controls
  JOB_CONCURRENCY: z.coerce.number().int().positive().default(5),
  JOB_RATE_MAX: z.coerce.number().int().positive().default(100),
  JOB_RATE_DURATION: z.coerce.number().int().positive().default(10000),

  // Registration funding policy
  // Safety multiplier applied to simulated registration fee when funding new wallets
  REG_FEE_SAFETY_MULTIPLIER: z.coerce.number().positive().default(1.3),

  // Preflight balance and auto-top-up
  ENABLE_PREFLIGHT_BALANCE_CHECK: z.coerce.boolean().default(true),
  MIN_WALLET_BALANCE_UALLO: z.coerce.number().int().nonnegative().default(20000),
  TOPUP_AMOUNT_UALLO: z.coerce.number().int().positive().default(50000),

  // Metrics protection
  METRICS_TOKEN: z.string().optional(),
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