-- Migration: 006_add_clerk_integration
-- Description: Adds Clerk authentication support to the users table.
-- This migration removes API key fields and adds Clerk user ID support.

BEGIN;

-- Add clerk_user_id column to the users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS clerk_user_id VARCHAR(255) UNIQUE;

-- Create an index on clerk_user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON users(clerk_user_id);

-- Remove API key related columns since Clerk handles authentication
ALTER TABLE users DROP COLUMN IF EXISTS api_key_hash;
ALTER TABLE users DROP COLUMN IF EXISTS api_key_prefix;

-- Add comments explaining the new fields
COMMENT ON COLUMN users.clerk_user_id IS 'Clerk user ID for OAuth authentication.';
COMMENT ON COLUMN users.email IS 'User email address from Clerk authentication.';

COMMIT; 