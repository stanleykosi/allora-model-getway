-- Migration: 001_create_users_table
-- Description: Creates the `users` table to store information about data scientists.
-- This table is fundamental for authentication and associating models with their creators.

-- The `pgrcrypto` extension is required for `gen_random_uuid()`.
-- Ensure it is enabled in your database.
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

BEGIN;

CREATE TABLE IF NOT EXISTS users (
    -- Primary key for the user, using a randomly generated UUID for security
    -- and to avoid collisions in a distributed environment.
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- The user's email address. It must be unique as it will likely serve
    -- as a login identifier or for communication purposes.
    email VARCHAR(255) UNIQUE NOT NULL,

    -- Stores a secure, hashed version of the user's API key.
    -- Storing the hash instead of the plaintext key is a critical security measure.
    -- This must be unique to prevent key duplication.
    api_key_hash VARCHAR(255) UNIQUE NOT NULL,

    -- Timestamp for when the user record was created.
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Timestamp for when the user record was last updated.
    -- This is useful for tracking changes and for cache invalidation strategies.
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- It's good practice to add comments to tables and columns for future reference.
COMMENT ON TABLE users IS 'Stores information about the Data Scientists who use the MCP server.';
COMMENT ON COLUMN users.id IS 'Unique identifier for the user (UUID).';
COMMENT ON COLUMN users.email IS 'User''s unique email address.';
COMMENT ON COLUMN users.api_key_hash IS 'Hashed API key for authentication.';
COMMENT ON COLUMN users.created_at IS 'Timestamp of user creation.';
COMMENT ON COLUMN users.updated_at IS 'Timestamp of last user update.';

COMMIT;