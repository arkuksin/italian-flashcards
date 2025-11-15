-- Multi-Language Support Feature
-- This migration adds support for additional language pairs (German and English)
-- and enables tracking progress separately for each language pair

-- ============================================
-- PHASE 1: Extend words table with new languages
-- ============================================

-- Add columns for German and English translations
ALTER TABLE words
ADD COLUMN IF NOT EXISTS german TEXT,
ADD COLUMN IF NOT EXISTS english TEXT;

-- ============================================
-- PHASE 2: Create language_pairs table
-- ============================================

CREATE TABLE IF NOT EXISTS language_pairs (
  id SERIAL PRIMARY KEY,
  source_lang VARCHAR(5) NOT NULL,    -- 'ru', 'it', 'de', 'en'
  target_lang VARCHAR(5) NOT NULL,    -- 'ru', 'it', 'de', 'en'
  is_active BOOLEAN DEFAULT true,
  display_name_source TEXT NOT NULL,  -- 'Русский', 'Italiano', 'Deutsch', 'English'
  display_name_target TEXT NOT NULL,
  flag_emoji_source VARCHAR(10),      -- '🇷🇺', '🇮🇹', '🇩🇪', '🇬🇧'
  flag_emoji_target VARCHAR(10),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(source_lang, target_lang),
  CHECK(source_lang != target_lang)
);

-- Insert initial language pairs
INSERT INTO language_pairs (source_lang, target_lang, display_name_source, display_name_target, flag_emoji_source, flag_emoji_target)
VALUES
  ('ru', 'it', 'Русский', 'Italiano', '🇷🇺', '🇮🇹'),
  ('it', 'ru', 'Italiano', 'Русский', '🇮🇹', '🇷🇺'),
  ('de', 'it', 'Deutsch', 'Italiano', '🇩🇪', '🇮🇹'),
  ('it', 'de', 'Italiano', 'Deutsch', '🇮🇹', '🇩🇪'),
  ('en', 'it', 'English', 'Italiano', '🇬🇧', '🇮🇹'),
  ('it', 'en', 'Italiano', 'English', '🇮🇹', '🇬🇧')
ON CONFLICT (source_lang, target_lang) DO NOTHING;

-- Enable RLS on language_pairs
ALTER TABLE language_pairs ENABLE ROW LEVEL SECURITY;

-- Language pairs are viewable by everyone
CREATE POLICY "Language pairs are viewable by everyone" ON language_pairs
  FOR SELECT USING (true);

-- ============================================
-- PHASE 3: Update user_progress table
-- ============================================

-- Add language_pair_id column (nullable initially for migration)
ALTER TABLE user_progress
ADD COLUMN IF NOT EXISTS language_pair_id INTEGER REFERENCES language_pairs(id);

-- Migrate existing data to use Russian-Italian pair (id=1)
UPDATE user_progress
SET language_pair_id = (SELECT id FROM language_pairs WHERE source_lang = 'ru' AND target_lang = 'it' LIMIT 1)
WHERE language_pair_id IS NULL;

-- Now make it NOT NULL
ALTER TABLE user_progress
ALTER COLUMN language_pair_id SET NOT NULL;

-- Update unique constraint to include language_pair_id
ALTER TABLE user_progress
DROP CONSTRAINT IF EXISTS user_progress_user_id_word_id_key;

ALTER TABLE user_progress
ADD CONSTRAINT user_progress_user_word_pair_unique
UNIQUE(user_id, word_id, language_pair_id);

-- Create index for language pair queries
CREATE INDEX IF NOT EXISTS idx_user_progress_language_pair ON user_progress(language_pair_id);

-- ============================================
-- PHASE 4: Update learning_sessions table
-- ============================================

-- Add language_pair_id column
ALTER TABLE learning_sessions
ADD COLUMN IF NOT EXISTS language_pair_id INTEGER REFERENCES language_pairs(id);

-- Migrate existing sessions based on learning_direction
UPDATE learning_sessions
SET language_pair_id = (
  SELECT id FROM language_pairs
  WHERE (source_lang = 'ru' AND target_lang = 'it' AND learning_sessions.learning_direction = 'ru-it')
     OR (source_lang = 'it' AND target_lang = 'ru' AND learning_sessions.learning_direction = 'it-ru')
  LIMIT 1
)
WHERE language_pair_id IS NULL;

-- Keep learning_direction for backward compatibility but add index on language_pair_id
CREATE INDEX IF NOT EXISTS idx_learning_sessions_language_pair ON learning_sessions(language_pair_id);

-- ============================================
-- PHASE 5: Update review_history table
-- ============================================

-- Add language_pair_id column to review_history
ALTER TABLE review_history
ADD COLUMN IF NOT EXISTS language_pair_id INTEGER REFERENCES language_pairs(id);

-- Migrate existing review history (assume ru-it for existing data)
UPDATE review_history
SET language_pair_id = (SELECT id FROM language_pairs WHERE source_lang = 'ru' AND target_lang = 'it' LIMIT 1)
WHERE language_pair_id IS NULL;

-- Create index for language pair queries
CREATE INDEX IF NOT EXISTS idx_review_history_language_pair ON review_history(language_pair_id);

-- ============================================
-- PHASE 6: Create views and functions
-- ============================================

-- View: Statistics per language pair
CREATE OR REPLACE VIEW v_language_pair_stats AS
SELECT
  lp.id as language_pair_id,
  lp.source_lang,
  lp.target_lang,
  lp.display_name_source,
  lp.display_name_target,
  lp.flag_emoji_source,
  lp.flag_emoji_target,
  up.user_id,
  COUNT(DISTINCT up.word_id) as words_learned,
  ROUND(AVG(
    CASE
      WHEN up.correct_count + up.wrong_count > 0
      THEN up.correct_count::NUMERIC / (up.correct_count + up.wrong_count)
      ELSE 0
    END
  ) * 100, 2) as avg_accuracy,
  ROUND(AVG(up.mastery_level), 2) as avg_mastery_level
FROM language_pairs lp
CROSS JOIN auth.users u
LEFT JOIN user_progress up ON up.language_pair_id = lp.id AND up.user_id = u.id
WHERE lp.is_active = true
GROUP BY lp.id, lp.source_lang, lp.target_lang, lp.display_name_source, lp.display_name_target, lp.flag_emoji_source, lp.flag_emoji_target, up.user_id;

-- Enable RLS on the view (allows authenticated users to see their own stats)
ALTER VIEW v_language_pair_stats SET (security_invoker = true);

-- Function: Get word translation for a specific language
CREATE OR REPLACE FUNCTION get_word_translation(
  p_word_id INTEGER,
  p_language VARCHAR(5)
)
RETURNS TEXT AS $$
DECLARE
  v_translation TEXT;
BEGIN
  SELECT
    CASE p_language
      WHEN 'ru' THEN russian
      WHEN 'it' THEN italian
      WHEN 'de' THEN german
      WHEN 'en' THEN english
      ELSE NULL
    END
  INTO v_translation
  FROM words
  WHERE id = p_word_id;

  RETURN v_translation;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_word_translation TO authenticated;

-- ============================================
-- PHASE 7: Update user_preferences table
-- ============================================

-- Add default language pair preference
ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS default_language_pair_id INTEGER REFERENCES language_pairs(id);

-- Set default to Russian-Italian for existing users
UPDATE user_preferences
SET default_language_pair_id = (SELECT id FROM language_pairs WHERE source_lang = 'ru' AND target_lang = 'it' LIMIT 1)
WHERE default_language_pair_id IS NULL;

-- ============================================
-- PHASE 8: Helper function to get available words count
-- ============================================

-- Function to count words with translations for a language pair
CREATE OR REPLACE FUNCTION count_available_words_for_pair(
  p_source_lang VARCHAR(5),
  p_target_lang VARCHAR(5)
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Count words that have both source and target translations
  SELECT COUNT(*)
  INTO v_count
  FROM words
  WHERE
    CASE p_source_lang
      WHEN 'ru' THEN russian IS NOT NULL AND russian != ''
      WHEN 'it' THEN italian IS NOT NULL AND italian != ''
      WHEN 'de' THEN german IS NOT NULL AND german != ''
      WHEN 'en' THEN english IS NOT NULL AND english != ''
      ELSE FALSE
    END
    AND
    CASE p_target_lang
      WHEN 'ru' THEN russian IS NOT NULL AND russian != ''
      WHEN 'it' THEN italian IS NOT NULL AND italian != ''
      WHEN 'de' THEN german IS NOT NULL AND german != ''
      WHEN 'en' THEN english IS NOT NULL AND english != ''
      ELSE FALSE
    END;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION count_available_words_for_pair TO authenticated;

-- ============================================
-- PHASE 9: Comments for documentation
-- ============================================

COMMENT ON TABLE language_pairs IS 'Defines available language pair combinations for learning';
COMMENT ON COLUMN words.german IS 'German translation of the word';
COMMENT ON COLUMN words.english IS 'English translation of the word';
COMMENT ON COLUMN user_progress.language_pair_id IS 'References the language pair for this progress entry';
COMMENT ON VIEW v_language_pair_stats IS 'Statistics aggregated by language pair per user';
COMMENT ON FUNCTION get_word_translation IS 'Retrieves word translation for a specific language code';
COMMENT ON FUNCTION count_available_words_for_pair IS 'Counts words with complete translations for a language pair';
