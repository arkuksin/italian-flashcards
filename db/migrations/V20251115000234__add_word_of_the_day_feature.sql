-- Migration: Add Word of the Day Feature
-- Description: Creates tables and functions for Word of the Day feature
-- Date: 2025-11-15

-- Table for Word of the Day
CREATE TABLE IF NOT EXISTS word_of_the_day (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  word_id INTEGER REFERENCES words(id) ON DELETE CASCADE,
  date DATE NOT NULL UNIQUE,
  description TEXT NOT NULL,
  fun_fact TEXT, -- Interesting additional info
  difficulty_level INTEGER DEFAULT 2, -- 1-5, for level matching
  is_seasonal BOOLEAN DEFAULT false, -- Seasonal relevance
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wotd_date ON word_of_the_day(date DESC);
CREATE INDEX IF NOT EXISTS idx_wotd_level ON word_of_the_day(difficulty_level);

-- User Tracking: Has user seen/learned the WotD?
CREATE TABLE IF NOT EXISTS user_wotd_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  wotd_id UUID REFERENCES word_of_the_day(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE, -- When user practiced the word

  UNIQUE(user_id, wotd_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_wotd_user ON user_wotd_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wotd_completed ON user_wotd_progress(completed_at);

-- RLS
ALTER TABLE user_wotd_progress ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own WotD progress" ON user_wotd_progress;
DROP POLICY IF EXISTS "Users can insert their own WotD progress" ON user_wotd_progress;
DROP POLICY IF EXISTS "Users can update their own WotD progress" ON user_wotd_progress;

-- Create RLS policies
CREATE POLICY "Users can view their own WotD progress"
  ON user_wotd_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own WotD progress"
  ON user_wotd_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own WotD progress"
  ON user_wotd_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Function: Get WotD for a specific date
CREATE OR REPLACE FUNCTION get_word_of_the_day(p_date DATE)
RETURNS TABLE (
  id UUID,
  word_id INTEGER,
  russian TEXT,
  italian TEXT,
  category TEXT,
  description TEXT,
  fun_fact TEXT,
  difficulty_level INTEGER,
  date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    wotd.id,
    wotd.word_id,
    w.russian,
    w.italian,
    w.category,
    wotd.description,
    wotd.fun_fact,
    wotd.difficulty_level,
    wotd.date
  FROM word_of_the_day wotd
  JOIN words w ON w.id = wotd.word_id
  WHERE wotd.date = p_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Generate WotD for next day (automatic)
CREATE OR REPLACE FUNCTION generate_next_word_of_the_day()
RETURNS UUID AS $$
DECLARE
  v_next_date DATE;
  v_word_id INTEGER;
  v_wotd_id UUID;
BEGIN
  -- Find next date without WotD
  SELECT COALESCE(MAX(date), CURRENT_DATE) + INTERVAL '1 day'
  INTO v_next_date
  FROM word_of_the_day;

  -- Select a word that hasn't been WotD yet
  SELECT w.id INTO v_word_id
  FROM words w
  WHERE w.id NOT IN (SELECT word_id FROM word_of_the_day WHERE word_id IS NOT NULL)
  ORDER BY RANDOM()
  LIMIT 1;

  IF v_word_id IS NULL THEN
    RAISE EXCEPTION 'No more words available for Word of the Day';
  END IF;

  -- Create WotD entry
  INSERT INTO word_of_the_day (word_id, date, description, difficulty_level)
  VALUES (
    v_word_id,
    v_next_date,
    'Ein wichtiges Wort für Ihren täglichen Wortschatz.',
    2
  )
  RETURNING id INTO v_wotd_id;

  RETURN v_wotd_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert first Word of the Day for today if it doesn't exist
DO $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_exists BOOLEAN;
  v_word_id INTEGER;
BEGIN
  -- Check if today's word already exists
  SELECT EXISTS(SELECT 1 FROM word_of_the_day WHERE date = v_today) INTO v_exists;

  IF NOT v_exists THEN
    -- Get a random word for today
    SELECT id INTO v_word_id
    FROM words
    ORDER BY RANDOM()
    LIMIT 1;

    IF v_word_id IS NOT NULL THEN
      INSERT INTO word_of_the_day (word_id, date, description, difficulty_level)
      VALUES (
        v_word_id,
        v_today,
        'Ein wichtiges Wort für Ihren täglichen Wortschatz.',
        2
      );
    END IF;
  END IF;
END $$;
