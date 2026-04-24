-- ============================================================
-- BitBingo Session Duration Support
-- ============================================================

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER NOT NULL DEFAULT 45;

ALTER TABLE sessions
  DROP CONSTRAINT IF EXISTS sessions_duration_minutes_check;

ALTER TABLE sessions
  ADD CONSTRAINT sessions_duration_minutes_check CHECK (duration_minutes > 0);
