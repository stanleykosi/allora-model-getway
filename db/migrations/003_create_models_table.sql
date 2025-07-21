-- Migration: 003_create_models_table
-- Description: Creates the `models` table to store information about registered ML models.
-- This table connects users, wallets, and model-specific configurations.

BEGIN;

CREATE TABLE IF NOT EXISTS models (
    -- Primary key for the model, using a randomly generated UUID.
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Foreign key to the `users` table. Establishes the owner of the model.
    -- ON DELETE CASCADE ensures that if a user is deleted, all their associated models are also deleted.
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Foreign key to the `wallets` table. Links the model to its isolated, managed wallet.
    -- This relationship is one-to-one; each model has its own wallet.
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT,

    -- The HTTP(S) endpoint of the data scientist's model that the server will call for inferences.
    webhook_url VARCHAR(2048) NOT NULL,

    -- The ID of the Allora topic this model will submit inferences to.
    topic_id VARCHAR(64) NOT NULL,

    -- The type of model, e.g., "inference" or "forecaster". Enforced by application logic.
    model_type VARCHAR(50) NOT NULL,

    -- An optional user-defined ceiling for gas prices (e.g., "10uallo") to control costs.
    max_gas_price VARCHAR(100),

    -- A flag to easily enable or disable inference scheduling for this model.
    is_active BOOLEAN NOT NULL DEFAULT true,

    -- Timestamp for when the model record was created.
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Timestamp for when the model record was last updated.
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes on foreign keys and frequently queried columns to improve performance.
CREATE INDEX IF NOT EXISTS idx_models_user_id ON models(user_id);
CREATE INDEX IF NOT EXISTS idx_models_topic_id ON models(topic_id);
CREATE INDEX IF NOT EXISTS idx_models_wallet_id ON models(wallet_id);


COMMENT ON TABLE models IS 'Stores metadata and configuration for each ML model registered with the server.';
COMMENT ON COLUMN models.id IS 'Unique identifier for the model (UUID).';
COMMENT ON COLUMN models.user_id IS 'Foreign key linking to the user who owns the model.';
COMMENT ON COLUMN models.wallet_id IS 'Foreign key linking to the model''s isolated wallet.';
COMMENT ON COLUMN models.webhook_url IS 'The model''s inference webhook endpoint.';
COMMENT ON COLUMN models.topic_id IS 'The Allora topic ID the model participates in.';
COMMENT ON COLUMN models.model_type IS 'The type of model, e.g., "inference" or "forecaster".';
COMMENT ON COLUMN models.max_gas_price IS 'Optional maximum gas price the user is willing to pay.';
COMMENT ON COLUMN models.is_active IS 'Whether the server should schedule jobs for this model.';
COMMENT ON COLUMN models.created_at IS 'Timestamp of model registration.';
COMMENT ON COLUMN models.updated_at IS 'Timestamp of last model update.';

COMMIT;