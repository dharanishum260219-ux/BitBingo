-- ============================================================
-- BitBingo Session Core Upgrade
-- ============================================================

-- Extend sessions with timer + lifecycle metadata.
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER NOT NULL DEFAULT 45,
  ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '45 minutes'),
  ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

ALTER TABLE sessions
  ADD CONSTRAINT sessions_duration_positive CHECK (duration_minutes > 0);

ALTER TABLE sessions
  ADD CONSTRAINT sessions_status_valid CHECK (status IN ('scheduled', 'active', 'stopped', 'ended'));

-- Session-specific question bank.
CREATE TABLE IF NOT EXISTS session_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions (id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, position)
);

ALTER TABLE session_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "session_questions_select_public"
  ON session_questions FOR SELECT
  USING (true);

CREATE POLICY "session_questions_insert_authenticated"
  ON session_questions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "session_questions_update_authenticated"
  ON session_questions FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Canonical session team store.
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, name)
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teams_select_public"
  ON teams FOR SELECT
  USING (true);

CREATE POLICY "teams_insert_authenticated"
  ON teams FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "teams_update_authenticated"
  ON teams FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Score event history used for winner graphs.
CREATE TABLE IF NOT EXISTS score_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions (id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams (id) ON DELETE CASCADE,
  points_delta INTEGER NOT NULL DEFAULT 1,
  score_after INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'coordinator',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE score_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "score_events_select_public"
  ON score_events FOR SELECT
  USING (true);

CREATE POLICY "score_events_insert_authenticated"
  ON score_events FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS teams_session_id_idx ON teams (session_id);
CREATE INDEX IF NOT EXISTS score_events_session_id_idx ON score_events (session_id, created_at);
CREATE INDEX IF NOT EXISTS session_questions_session_id_idx ON session_questions (session_id);

-- Enable realtime for the new live tables.
ALTER PUBLICATION supabase_realtime ADD TABLE teams;
ALTER PUBLICATION supabase_realtime ADD TABLE session_questions;
ALTER PUBLICATION supabase_realtime ADD TABLE score_events;
