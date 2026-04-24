-- ============================================================
-- BitBingo Challenge Metadata Revamp
-- ============================================================

ALTER TABLE challenges
  ADD COLUMN IF NOT EXISTS difficulty TEXT NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS points INTEGER NOT NULL DEFAULT 70;

ALTER TABLE challenges
  DROP CONSTRAINT IF EXISTS challenges_points_check;

ALTER TABLE challenges
  ADD CONSTRAINT challenges_points_check CHECK (points > 0);

-- Normalize historical rows in case of null-like legacy values.
UPDATE challenges
SET difficulty = COALESCE(NULLIF(TRIM(difficulty), ''), 'medium'),
    points = CASE WHEN points IS NULL OR points <= 0 THEN 70 ELSE points END;
