-- Leitner System Phase 3: Advanced Spaced Repetition
-- Add review_history table for detailed tracking of individual review attempts

-- Review history table for tracking each individual review attempt
CREATE TABLE IF NOT EXISTS review_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  word_id INTEGER REFERENCES words(id) ON DELETE CASCADE NOT NULL,
  review_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  correct BOOLEAN NOT NULL,
  response_time_ms INTEGER,
  difficulty_rating INTEGER CHECK (difficulty_rating BETWEEN 1 AND 4),
  previous_level INTEGER CHECK (previous_level BETWEEN 0 AND 5),
  new_level INTEGER CHECK (new_level BETWEEN 0 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indices for efficient querying
CREATE INDEX IF NOT EXISTS idx_review_history_user_id ON review_history(user_id);
CREATE INDEX IF NOT EXISTS idx_review_history_word_id ON review_history(word_id);
CREATE INDEX IF NOT EXISTS idx_review_history_review_date ON review_history(review_date DESC);
CREATE INDEX IF NOT EXISTS idx_review_history_user_word ON review_history(user_id, word_id);

-- Enable Row Level Security
ALTER TABLE review_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies: users can only access their own review history
CREATE POLICY "Users can view own review history" ON review_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own review history" ON review_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users should not be able to update or delete review history
-- This maintains data integrity for learning analytics

-- Add comment for documentation
COMMENT ON TABLE review_history IS 'Tracks detailed history of each word review for advanced spaced repetition and analytics';
COMMENT ON COLUMN review_history.difficulty_rating IS 'User-rated difficulty: 1=Again, 2=Hard, 3=Good, 4=Easy';
COMMENT ON COLUMN review_history.response_time_ms IS 'Time taken to answer in milliseconds';
COMMENT ON COLUMN review_history.previous_level IS 'Mastery level before this review (0-5)';
COMMENT ON COLUMN review_history.new_level IS 'Mastery level after this review (0-5)';
