-- Enhance Channels Table (Spaces)
ALTER TABLE public.channels
ADD COLUMN IF NOT EXISTS slug TEXT,
ADD COLUMN IF NOT EXISTS icon TEXT,
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'post', -- 'post', 'chat', 'course', 'event'
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS category TEXT; -- For grouping like "The Freedom Club"

-- Add constraints where applicable
ALTER TABLE public.channels ADD CONSTRAINT unique_channel_slug_per_community UNIQUE (community_id, slug);

-- Create Community Links Table
CREATE TABLE public.community_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
    label TEXT NOT NULL,
    url TEXT NOT NULL,
    icon TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Links
ALTER TABLE public.community_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Community links viewable by everyone" 
    ON public.community_links FOR SELECT USING (true);

-- Functions to fetch sidebar data efficiently could be added here, 
-- but we'll use standard Supabase select for now.

-- Seed default spaces for existing communities if needed
-- (This part might need to be run manually or as a separate seed script)
DO $$
DECLARE
    comm_id UUID;
    default_owner UUID;
BEGIN
    -- Try to find a default community or create one if none exists (just for safety in dev)
    SELECT id INTO comm_id FROM public.communities LIMIT 1;
    SELECT id INTO default_owner FROM public.profiles LIMIT 1;

    IF comm_id IS NOT NULL THEN
        -- Add 'Start Here' space
        INSERT INTO public.channels (community_id, name, slug, description, type, icon, order_index, category)
        VALUES (comm_id, 'Start Here', 'start-here', 'Welcome to the community', 'post', 'check-circle', 1, 'The Freedom Club')
        ON CONFLICT DO NOTHING;

        -- Add 'Announcements' space
        INSERT INTO public.channels (community_id, name, slug, description, type, icon, order_index, category)
        VALUES (comm_id, 'Announcements', 'announcements', 'Important updates', 'post', 'megaphone', 2, 'The Freedom Club')
        ON CONFLICT DO NOTHING;

        -- Add 'Introductions' space
        INSERT INTO public.channels (community_id, name, slug, description, type, icon, order_index, category)
        VALUES (comm_id, 'Introductions', 'introductions', 'Say hello!', 'post', 'hand', 3, 'The Freedom Club')
        ON CONFLICT DO NOTHING;

        -- Add 'Community' space
        INSERT INTO public.channels (community_id, name, slug, description, type, icon, order_index, category)
        VALUES (comm_id, 'Community', 'community-chat', 'General discussion', 'chat', 'message-circle', 4, 'The Freedom Club')
        ON CONFLICT DO NOTHING;
        
         -- Add 'Events' space
        INSERT INTO public.channels (community_id, name, slug, description, type, icon, order_index, category)
        VALUES (comm_id, 'Events', 'events', 'Upcoming events', 'event', 'calendar', 5, 'The Freedom Club')
        ON CONFLICT DO NOTHING;

        -- Add a Link
        INSERT INTO public.community_links (community_id, label, url, icon, order_index)
        VALUES (comm_id, 'Download App', '#', 'smartphone', 1)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
