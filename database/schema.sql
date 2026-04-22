-- ============================================================
-- BitBingo Database Schema
-- ============================================================

-- ─── SESSIONS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions_select_public"
  ON sessions FOR SELECT
  USING (true);

CREATE POLICY "sessions_insert_authenticated"
  ON sessions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "sessions_update_authenticated"
  ON sessions FOR UPDATE
  USING (auth.role() = 'authenticated');

-- ─── PARTICIPANTS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS participants (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  score      INTEGER NOT NULL DEFAULT 0,
  session_id UUID REFERENCES sessions (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "participants_select_public"
  ON participants FOR SELECT
  USING (true);

CREATE POLICY "participants_insert_authenticated"
  ON participants FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "participants_update_authenticated"
  ON participants FOR UPDATE
  USING (auth.role() = 'authenticated');

-- ─── CHALLENGES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS challenges (
  id          SERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  position    INTEGER NOT NULL UNIQUE CHECK (position BETWEEN 0 AND 24)
);

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "challenges_select_public"
  ON challenges FOR SELECT
  USING (true);

CREATE POLICY "challenges_insert_authenticated"
  ON challenges FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ─── COMPLETIONS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS completions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants (id) ON DELETE CASCADE,
  challenge_id   INTEGER NOT NULL REFERENCES challenges (id) ON DELETE CASCADE,
  session_id     UUID NOT NULL REFERENCES sessions (id) ON DELETE CASCADE,
  proof_url      TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (participant_id, challenge_id)
);

ALTER TABLE completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "completions_select_public"
  ON completions FOR SELECT
  USING (true);

CREATE POLICY "completions_insert_authenticated"
  ON completions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ─── REALTIME ────────────────────────────────────────────────
-- Enable realtime for participants and completions tables
ALTER PUBLICATION supabase_realtime ADD TABLE participants;
ALTER PUBLICATION supabase_realtime ADD TABLE completions;

-- ─── ATOMIC SCORE INCREMENT ──────────────────────────────────
-- Used by the coordinator portal to avoid read-then-write race conditions
CREATE OR REPLACE FUNCTION increment_participant_score(p_id UUID)
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
AS $$
  UPDATE participants SET score = score + 1 WHERE id = p_id;
$$;

-- ─── ADMIN SESSION CREATION ──────────────────────────────────
-- Used by the admin portal to replace the active session atomically
CREATE OR REPLACE FUNCTION create_admin_session(p_name TEXT)
RETURNS sessions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_session sessions;
BEGIN
  UPDATE sessions SET is_active = false WHERE is_active = true;
  INSERT INTO sessions (name, is_active)
  VALUES (p_name, true)
  RETURNING * INTO new_session;
  RETURN new_session;
END;
$$;

GRANT EXECUTE ON FUNCTION create_admin_session(TEXT) TO anon, authenticated;

-- ─── STORAGE BUCKET ──────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('proofs', 'proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read on proofs bucket
CREATE POLICY "proofs_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'proofs');

-- Allow authenticated users to upload proofs
CREATE POLICY "proofs_insert_authenticated"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'proofs' AND auth.role() = 'authenticated');
