-- Add access_level and settings to channels
ALTER TABLE public.channels
ADD COLUMN IF NOT EXISTS access_level TEXT DEFAULT 'open', -- 'open', 'private', 'secret'
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb; -- { notification_email: true, notification_in_app: true, ... }

-- Add comment explaining options
COMMENT ON COLUMN public.channels.access_level IS 'open, private, secret';
COMMENT ON COLUMN public.channels.settings IS 'Flexible settings for notifications and space-specific configs';
