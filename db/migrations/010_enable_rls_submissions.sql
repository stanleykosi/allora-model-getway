-- Enable Row Level Security (RLS) for submissions and define policies

BEGIN;

-- Enable and force RLS on submissions table
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions FORCE ROW LEVEL SECURITY;

-- Allow users to SELECT only their own submissions via model ownership
CREATE POLICY "submissions_select_owner" ON submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM models m
      WHERE m.id::text = submissions.model_id
        AND m.user_id = auth.uid()::uuid
    )
  );

-- Inserts are performed by backend service; if client-side inserts are required,
-- add an INSERT policy with appropriate checks. For now, not exposing INSERT/UPDATE/DELETE.

COMMIT;


