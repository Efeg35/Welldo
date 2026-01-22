-- Add settings column to course_lessons
ALTER TABLE course_lessons
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- Add comment explaining structure
COMMENT ON COLUMN course_lessons.settings IS 'Stores lesson settings: enable_featured_media, enable_comments, enforce_video_completion, auto_advance';
