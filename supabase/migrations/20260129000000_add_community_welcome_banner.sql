-- Add welcome_banner column to communities table
ALTER TABLE public.communities
ADD COLUMN IF NOT EXISTS welcome_banner JSONB DEFAULT '{"title": "", "description": "", "image_url": "", "show_button": true, "styles": {}}'::jsonb;

-- Add comment
COMMENT ON COLUMN public.communities.welcome_banner IS 'Stores configuration for the community welcome banner (Feed page)';
