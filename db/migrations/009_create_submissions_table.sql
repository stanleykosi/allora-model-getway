-- Create submissions table to persist on-chain submission attempts
-- Stores one row per attempt (success or failure)

CREATE TABLE IF NOT EXISTS submissions (
  id BIGSERIAL PRIMARY KEY,
  model_id TEXT NOT NULL,
  topic_id TEXT NOT NULL,
  nonce_height BIGINT,
  tx_hash TEXT,
  status TEXT NOT NULL, -- 'success' | 'failed'
  raw_log TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS submissions_model_idx ON submissions (model_id);
CREATE INDEX IF NOT EXISTS submissions_topic_idx ON submissions (topic_id);
CREATE INDEX IF NOT EXISTS submissions_created_at_idx ON submissions (created_at DESC);


