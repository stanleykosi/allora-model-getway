-- Add a column to store the registration fee (in uallo) charged for on-chain registration
-- This enables cost transparency and potential user billing reconciliation.

ALTER TABLE models
  ADD COLUMN IF NOT EXISTS registration_fee_uallo BIGINT;

-- Optional index if you plan to filter/report by fee
-- CREATE INDEX IF NOT EXISTS models_registration_fee_idx ON models (registration_fee_uallo);


