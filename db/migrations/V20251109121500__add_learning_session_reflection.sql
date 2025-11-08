-- Migration: Add reflection notes column to learning sessions
-- Author: Codex CLI
-- Date: 2025-11-09
-- Description: Allow learners to store a short reflection after each study session
--              so coaches can review qualitative feedback. Column is nullable and
--              kept lightweight to stay backwards compatible.

ALTER TABLE public.learning_sessions
ADD COLUMN IF NOT EXISTS reflection_notes TEXT
CHECK (reflection_notes IS NULL OR char_length(reflection_notes) <= 500);

COMMENT ON COLUMN public.learning_sessions.reflection_notes IS
'Optional learner reflection captured after a session; limited to 500 characters.';

COMMENT ON TABLE public.learning_sessions IS
'Stores every flashcard study session with timing, performance, and optional reflection notes.';

DO $$
BEGIN
    RAISE NOTICE '🗒️  Added optional reflection_notes column to learning_sessions.';
END $$;
