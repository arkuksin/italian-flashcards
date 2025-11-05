-- Migration: test migration system
-- Generated at 2025-11-05T22:05:32.009Z UTC
-- Purpose: Verify the migration system works end-to-end
-- This is a safe test migration that only adds documentation comments

-- Add table comments for documentation
COMMENT ON TABLE words IS
'Vocabulary words for Italian-Russian flashcard learning. Each word has translations and category information.';

COMMENT ON TABLE user_progress IS
'Tracks individual user progress for each vocabulary word using Leitner spaced repetition system.';

COMMENT ON TABLE user_preferences IS
'Stores user-specific settings including language preferences and learning modes.';

COMMENT ON TABLE learning_sessions IS
'Historical record of learning sessions for analytics and progress tracking.';

-- Verify table exists (safe check that won't fail)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'words') THEN
    RAISE NOTICE 'Migration test successful - words table exists';
  END IF;
END $$;
