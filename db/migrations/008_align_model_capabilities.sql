-- Migration: 008_align_model_capabilities
-- Description: Updates the `models` table to align with the official Allora payload structure.
-- This replaces the single `model_type` enum with two boolean flags, `is_inferer`
-- and `is_forecaster`, allowing a single model to perform both roles.

BEGIN;

-- Add the new boolean columns to the models table
ALTER TABLE models ADD COLUMN IF NOT EXISTS is_inferer BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE models ADD COLUMN IF NOT EXISTS is_forecaster BOOLEAN NOT NULL DEFAULT false;

-- Add comments for the new columns
COMMENT ON COLUMN models.is_inferer IS 'Indicates if the model can generate inferences.';
COMMENT ON COLUMN models.is_forecaster IS 'Indicates if the model can generate forecasts.';

-- Drop the old, restrictive model_type column
ALTER TABLE models DROP COLUMN IF EXISTS model_type;

COMMIT; 