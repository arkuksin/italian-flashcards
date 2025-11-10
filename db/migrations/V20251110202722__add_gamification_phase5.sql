-- Leitner System Phase 5: Gamification and Motivation
-- Add achievements and daily_goals tables for gamification features

-- Achievements table for tracking user milestones and badges
CREATE TABLE IF NOT EXISTS achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_type TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_type)
);

-- Daily goals table for streak tracking and daily targets
CREATE TABLE IF NOT EXISTS daily_goals (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  target_words_per_day INTEGER DEFAULT 20 CHECK (target_words_per_day > 0),
  current_streak INTEGER DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak INTEGER DEFAULT 0 CHECK (longest_streak >= 0),
  last_practice_date DATE,
  total_xp INTEGER DEFAULT 0 CHECK (total_xp >= 0),
  level INTEGER DEFAULT 1 CHECK (level > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indices for efficient querying
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_type ON achievements(achievement_type);
CREATE INDEX IF NOT EXISTS idx_achievements_unlocked_at ON achievements(unlocked_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_goals_last_practice ON daily_goals(last_practice_date DESC);

-- Enable Row Level Security
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievements: users can only access their own achievements
CREATE POLICY "Users can view own achievements" ON achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements" ON achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users should not be able to update or delete achievements
-- This maintains data integrity for gamification

-- RLS Policies for daily_goals: users can only access their own goals
CREATE POLICY "Users can view own daily goals" ON daily_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily goals" ON daily_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily goals" ON daily_goals
  FOR UPDATE USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE achievements IS 'Tracks user achievements and unlocked badges for gamification';
COMMENT ON COLUMN achievements.achievement_type IS 'Type of achievement (e.g., FIRST_WORD, STREAK_7, MASTER_50, etc.)';
COMMENT ON COLUMN achievements.metadata IS 'Additional data about the achievement (e.g., count, category)';

COMMENT ON TABLE daily_goals IS 'Tracks user daily goals, streaks, XP, and level for motivation';
COMMENT ON COLUMN daily_goals.target_words_per_day IS 'Number of words user aims to study per day';
COMMENT ON COLUMN daily_goals.current_streak IS 'Number of consecutive days with practice';
COMMENT ON COLUMN daily_goals.longest_streak IS 'Longest streak ever achieved';
COMMENT ON COLUMN daily_goals.total_xp IS 'Total experience points earned';
COMMENT ON COLUMN daily_goals.level IS 'User level calculated from XP';

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_daily_goals_updated_at
  BEFORE UPDATE ON daily_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
