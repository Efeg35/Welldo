-- Add release_at to course_modules
ALTER TABLE course_modules ADD COLUMN IF NOT EXISTS release_at TIMESTAMP WITH TIME ZONE;

-- Add comment for documentation
COMMENT ON COLUMN course_modules.release_at IS 'Specific date and time when the module should be released to students (for Scheduled courses).';
