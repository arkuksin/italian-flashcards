-- Category Filter Feature: Add category preferences and statistics
-- Allows users to select specific categories to practice

-- User category preferences table
CREATE TABLE IF NOT EXISTS user_category_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category VARCHAR(100) NOT NULL,
  is_selected BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  last_practiced TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category)
);

-- Create indices for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_cat_pref_user ON user_category_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_cat_pref_selected ON user_category_preferences(user_id, is_selected);
CREATE INDEX IF NOT EXISTS idx_user_cat_pref_category ON user_category_preferences(category);

-- Enable Row Level Security
ALTER TABLE user_category_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only manage their own category preferences
CREATE POLICY "Users can view own category preferences" ON user_category_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own category preferences" ON user_category_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own category preferences" ON user_category_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own category preferences" ON user_category_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- View: Category statistics with learned words and accuracy
CREATE OR REPLACE VIEW v_category_statistics AS
SELECT
  w.category,
  COUNT(DISTINCT w.id) as total_words,
  COUNT(DISTINCT CASE WHEN wp.mastery_level > 0 THEN wp.word_id END) as learned_words,
  ROUND(
    AVG(
      CASE
        WHEN wp.correct_count + wp.wrong_count > 0
        THEN wp.correct_count::NUMERIC / (wp.correct_count + wp.wrong_count)
        ELSE NULL
      END
    ) * 100,
    2
  ) as avg_accuracy,
  ROUND(AVG(wp.mastery_level), 2) as avg_mastery_level
FROM words w
LEFT JOIN user_progress wp ON wp.word_id = w.id
GROUP BY w.category;

-- Function: Get words filtered by selected categories
CREATE OR REPLACE FUNCTION get_words_by_categories(
  p_user_id UUID,
  p_categories TEXT[],
  p_learning_direction TEXT DEFAULT 'ru-it'
)
RETURNS TABLE (
  id INTEGER,
  russian TEXT,
  italian TEXT,
  category TEXT,
  mastery_level INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.id,
    w.russian,
    w.italian,
    w.category,
    COALESCE(wp.mastery_level, 0) as mastery_level
  FROM words w
  LEFT JOIN user_progress wp ON wp.word_id = w.id AND wp.user_id = p_user_id
  WHERE
    w.category = ANY(p_categories)
  ORDER BY RANDOM();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update updated_at timestamp
CREATE TRIGGER update_user_category_preferences_updated_at
  BEFORE UPDATE ON user_category_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE user_category_preferences IS 'Stores user preferences for category filtering during learning sessions';
COMMENT ON COLUMN user_category_preferences.is_selected IS 'Whether this category is selected for the current filter';
COMMENT ON COLUMN user_category_preferences.priority IS 'Priority level (1-10) for category suggestions';
COMMENT ON COLUMN user_category_preferences.last_practiced IS 'Last time user practiced words from this category';

COMMENT ON VIEW v_category_statistics IS 'Aggregated statistics per category including word counts and accuracy';

COMMENT ON FUNCTION get_words_by_categories IS 'Returns randomized words filtered by selected categories for a user';
