-- Add missing fields to channels and courses
ALTER TABLE channels ADD COLUMN IF NOT EXISTS access_level TEXT DEFAULT 'open';
ALTER TABLE channels ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Spaces';

-- Add topics to courses
ALTER TABLE courses ADD COLUMN IF NOT EXISTS topics TEXT[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN channels.access_level IS 'Access privacy level: open, private, secret';
COMMENT ON COLUMN channels.category IS 'Group/Category name for organizing spaces in the sidebar';
COMMENT ON COLUMN courses.topics IS 'List of topics/tags for course categorization';
