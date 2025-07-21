-- Migration: 004_create_performance_metrics_table
-- Description: Creates the `performance_metrics` table for storing time-series
-- performance data.

-- Note: The original plan to use TimescaleDB has been removed as the extension
-- is not available in this environment. This is now a standard PostgreSQL table.

BEGIN;

CREATE TABLE IF NOT EXISTS performance_metrics (
    -- Foreign key to the `models` table, linking the metric to a specific model.
    -- ON DELETE CASCADE ensures that if a model is deleted, its performance history is also purged.
    model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,

    -- The specific timestamp for this data point.
    "timestamp" TIMESTAMPTZ NOT NULL,

    -- The Exponential Moving Average (EMA) score of the worker on-chain.
    -- Using DECIMAL for high precision, which is crucial for financial/scoring data.
    ema_score DECIMAL(30, 18),

    -- This table can be extended with other relevant metrics from `query emissions latest-inference`
    -- as the project evolves.

    -- A composite primary key ensures that each metric is unique for a given model at a specific timestamp.
    PRIMARY KEY (model_id, "timestamp")
);

-- Indexing the timestamp column is crucial for efficient time-based queries.
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics("timestamp" DESC);


COMMENT ON TABLE performance_metrics IS 'Time-series table to store on-chain performance metrics for models.';
COMMENT ON COLUMN performance_metrics.model_id IS 'Foreign key to the model being measured.';
COMMENT ON COLUMN performance_metrics.timestamp IS 'The timestamp of the performance metric data point.';
COMMENT ON COLUMN performance_metrics.ema_score IS 'The on-chain Exponential Moving Average (EMA) score for the model''s worker.';

COMMIT;