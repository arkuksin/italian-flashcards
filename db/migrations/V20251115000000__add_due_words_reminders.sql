-- Migration: Add Due Words Reminders Feature
-- Description: Implements reminders for due words based on Leitner system intervals
-- Author: Claude Code
-- Date: 2025-11-15

-- Function: Calculate due words for a user based on Leitner intervals
CREATE OR REPLACE FUNCTION get_due_words(
  p_user_id UUID,
  p_include_overdue BOOLEAN DEFAULT true
)
RETURNS TABLE (
  word_id INTEGER,
  russian TEXT,
  italian TEXT,
  category TEXT,
  mastery_level INTEGER,
  last_practiced TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE,
  days_overdue INTEGER
) AS $$
DECLARE
  v_intervals INTEGER[] := ARRAY[1, 3, 7, 14, 30, 90]; -- Days per level (0-5)
BEGIN
  RETURN QUERY
  WITH word_due_dates AS (
    SELECT
      wp.word_id,
      wp.mastery_level,
      wp.last_practiced,
      wp.last_practiced + (v_intervals[wp.mastery_level + 1] || ' days')::INTERVAL as calculated_due_date
    FROM word_progress wp
    WHERE wp.user_id = p_user_id
  )
  SELECT
    w.id,
    w.russian,
    w.italian,
    w.category,
    wdd.mastery_level,
    wdd.last_practiced,
    wdd.calculated_due_date,
    GREATEST(0, EXTRACT(DAY FROM (NOW() - wdd.calculated_due_date))::INTEGER) as days_overdue
  FROM word_due_dates wdd
  JOIN words w ON w.id = wdd.word_id
  WHERE
    wdd.calculated_due_date <= NOW()
    OR (p_include_overdue AND wdd.calculated_due_date < NOW())
  ORDER BY wdd.calculated_due_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Table: User reminder settings
CREATE TABLE IF NOT EXISTS user_reminder_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  reminder_time TIME DEFAULT '19:00:00',
  timezone VARCHAR(50) DEFAULT 'UTC',
  min_due_words INTEGER DEFAULT 5, -- Minimum words to trigger reminder
  push_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT false,
  sms_enabled BOOLEAN DEFAULT false,
  reminder_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5], -- 1=Mon, 7=Sun
  last_reminder_sent TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_reminder_settings
ALTER TABLE user_reminder_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can manage their own reminder settings
CREATE POLICY "Users can manage their own reminder settings"
  ON user_reminder_settings
  FOR ALL
  USING (auth.uid() = user_id);

-- Table: Reminder history
CREATE TABLE IF NOT EXISTS reminder_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_words_count INTEGER NOT NULL,
  method VARCHAR(20) NOT NULL, -- 'push', 'email', 'sms'
  opened BOOLEAN DEFAULT false,
  opened_at TIMESTAMP WITH TIME ZONE,
  snoozed_until TIMESTAMP WITH TIME ZONE
);

-- Create indexes for reminder_history
CREATE INDEX IF NOT EXISTS idx_reminder_history_user ON reminder_history(user_id);
CREATE INDEX IF NOT EXISTS idx_reminder_history_sent ON reminder_history(sent_at DESC);

-- Enable RLS on reminder_history
ALTER TABLE reminder_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own reminder history
CREATE POLICY "Users can view their own reminder history"
  ON reminder_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: System can insert reminder history
CREATE POLICY "System can insert reminder history"
  ON reminder_history
  FOR INSERT
  WITH CHECK (true);

-- Function: Determine if a reminder should be sent to a user
CREATE OR REPLACE FUNCTION should_send_reminder(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_settings user_reminder_settings;
  v_due_count INTEGER;
  v_today_weekday INTEGER;
BEGIN
  -- Get user settings
  SELECT * INTO v_settings
  FROM user_reminder_settings
  WHERE user_id = p_user_id;

  -- If no settings found, default to no reminder
  IF v_settings IS NULL THEN
    RETURN false;
  END IF;

  -- Check if reminders are enabled
  IF NOT v_settings.enabled THEN
    RETURN false;
  END IF;

  -- Check if already sent today
  IF v_settings.last_reminder_sent IS NOT NULL AND
     v_settings.last_reminder_sent::DATE = CURRENT_DATE THEN
    RETURN false;
  END IF;

  -- Check weekday (1=Monday, 7=Sunday)
  v_today_weekday := EXTRACT(ISODOW FROM CURRENT_DATE);
  IF NOT (v_today_weekday = ANY(v_settings.reminder_days)) THEN
    RETURN false;
  END IF;

  -- Count due words
  SELECT COUNT(*) INTO v_due_count
  FROM get_due_words(p_user_id, true);

  IF v_due_count < v_settings.min_due_words THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment on tables and functions
COMMENT ON TABLE user_reminder_settings IS 'Stores user preferences for due word reminders';
COMMENT ON TABLE reminder_history IS 'Tracks all reminder notifications sent to users';
COMMENT ON FUNCTION get_due_words(UUID, BOOLEAN) IS 'Returns words that are due for review based on Leitner intervals';
COMMENT ON FUNCTION should_send_reminder(UUID) IS 'Determines if a reminder should be sent to a user today';
