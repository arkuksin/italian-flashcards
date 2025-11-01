-- Add language preference to user_preferences table
-- Migration: Add language_preference column
-- Date: 2025-10-31

-- Add language_preference column to user_preferences table
ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS language_preference TEXT DEFAULT 'en'
CHECK (language_preference IN ('en', 'ru', 'it', 'de'));

-- Add comment to document the column
COMMENT ON COLUMN user_preferences.language_preference IS 'User preferred language for UI (en=English, ru=Russian, it=Italian, de=German)';

-- Create index for faster language preference lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_language
ON user_preferences(language_preference);
