-- Migration: 004_add_api_key_prefix
-- Description: Adds an api_key_prefix column to the users table for efficient API key lookups.
-- This allows for direct user lookup instead of scanning all users.

BEGIN;

-- Add the api_key_prefix column to the users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS api_key_prefix VARCHAR(8) UNIQUE;

-- Create an index on the api_key_prefix for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_api_key_prefix ON users(api_key_prefix);

-- Add a comment explaining the purpose
COMMENT ON COLUMN users.api_key_prefix IS 'First 8 characters of the API key for efficient lookups. Must be unique.';

COMMIT; 