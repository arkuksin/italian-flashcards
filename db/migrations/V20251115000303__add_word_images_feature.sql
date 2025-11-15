-- Add word images feature
-- Migration: Create word_images table and add image settings to user_preferences
-- Date: 2025-11-15

-- Create word_images table
CREATE TABLE IF NOT EXISTS word_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word_id INTEGER NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  source VARCHAR(50) NOT NULL CHECK (source IN ('unsplash', 'pexels', 'custom', 'ai')),
  source_attribution TEXT,
  alt_text TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(word_id, image_url)
);

-- Create indices for word_images
CREATE INDEX IF NOT EXISTS idx_word_images_word_id ON word_images(word_id);
CREATE INDEX IF NOT EXISTS idx_word_images_primary ON word_images(word_id, is_primary) WHERE is_primary = true;

-- Add comment to document the table
COMMENT ON TABLE word_images IS 'Stores images associated with words for visual learning';
COMMENT ON COLUMN word_images.source IS 'Image source: unsplash, pexels, custom upload, or AI-generated';
COMMENT ON COLUMN word_images.is_primary IS 'Whether this is the primary/default image for the word';
COMMENT ON COLUMN word_images.source_attribution IS 'Copyright/credit information for the image';

-- Add image preferences to user_preferences table
ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS show_images BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS image_timing VARCHAR(20) DEFAULT 'always'
  CHECK (image_timing IN ('always', 'after_answer', 'never')),
ADD COLUMN IF NOT EXISTS image_size VARCHAR(20) DEFAULT 'medium'
  CHECK (image_size IN ('small', 'medium', 'large'));

-- Add comments for the new columns
COMMENT ON COLUMN user_preferences.show_images IS 'Whether to display images for words';
COMMENT ON COLUMN user_preferences.image_timing IS 'When to show images: always, after_answer, or never';
COMMENT ON COLUMN user_preferences.image_size IS 'Preferred image display size: small, medium, or large';

-- Enable Row Level Security for word_images
ALTER TABLE word_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for word_images
-- Everyone can view word images
CREATE POLICY "Word images are viewable by everyone" ON word_images
  FOR SELECT USING (true);

-- Only authenticated users can insert word images (for future admin features)
CREATE POLICY "Authenticated users can insert word images" ON word_images
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Only authenticated users can update word images
CREATE POLICY "Authenticated users can update word images" ON word_images
  FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Only authenticated users can delete word images
CREATE POLICY "Authenticated users can delete word images" ON word_images
  FOR DELETE USING (auth.uid() IS NOT NULL);
