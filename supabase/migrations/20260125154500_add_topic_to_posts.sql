-- Add topic column to posts table
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS topic TEXT;

-- Index for faster filtering by topic
CREATE INDEX IF NOT EXISTS idx_posts_topic ON public.posts(topic);
