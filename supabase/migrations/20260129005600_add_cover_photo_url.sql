-- Migration: Add cover_photo_url to communities table
-- This separates the cover photo from the welcome banner

ALTER TABLE communities 
ADD COLUMN IF NOT EXISTS cover_photo_url TEXT DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN communities.cover_photo_url IS 'URL for the full-width cover photo displayed at the top of the feed';
