-- Add channel_id to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS topics TEXT[], -- Array of strings for topics
ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS host_info JSONB; -- Store host details like name/avatar if different from creator

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_events_channel_id ON public.events(channel_id);
