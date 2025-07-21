-- Migration: 002_create_wallets_table
-- Description: Creates the `wallets` table to store references to model wallets.
-- This table intentionally avoids storing any sensitive private keys or mnemonics.

BEGIN;

CREATE TABLE IF NOT EXISTS wallets (
    -- Primary key for the wallet, using a randomly generated UUID.
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- The public address of the Allora wallet. This is safe to store and is used
    -- for on-chain identification and transactions. It must be unique.
    address VARCHAR(255) UNIQUE NOT NULL,

    -- A reference or identifier to the secret stored in the external secrets manager
    -- (e.g., a key in HashiCorp Vault). This is the link to the encrypted mnemonic.
    -- This design ensures private keys never touch the application database.
    secret_ref VARCHAR(255) UNIQUE NOT NULL,

    -- Timestamp for when the wallet record was created.
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Timestamp for when the wallet record was last updated.
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE wallets IS 'Stores public addresses and secure references to model wallets. Private keys are never stored here.';
COMMENT ON COLUMN wallets.id IS 'Unique identifier for the wallet record (UUID).';
COMMENT ON COLUMN wallets.address IS 'Public Allora wallet address.';
COMMENT ON COLUMN wallets.secret_ref IS 'Reference key to the encrypted mnemonic in a secure secrets manager.';
COMMENT ON COLUMN wallets.created_at IS 'Timestamp of wallet creation.';
COMMENT ON COLUMN wallets.updated_at IS 'Timestamp of last wallet update.';

COMMIT;