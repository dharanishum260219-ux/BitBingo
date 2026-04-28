-- Session-scoped coordinator authentication.
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS coordinator_password_hash TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS session_coordinators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions (id) ON DELETE CASCADE,
  usn TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, usn)
);

ALTER TABLE session_coordinators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "session_coordinators_select_authenticated"
  ON session_coordinators FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "session_coordinators_insert_authenticated"
  ON session_coordinators FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "session_coordinators_delete_authenticated"
  ON session_coordinators FOR DELETE
  USING (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS session_coordinators_session_id_idx ON session_coordinators (session_id);
CREATE INDEX IF NOT EXISTS session_coordinators_session_usn_idx ON session_coordinators (session_id, usn);
