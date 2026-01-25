-- Create Bookmarks table
CREATE TABLE IF NOT EXISTS public.bookmarks (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);

-- Enable RLS
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Bookmarks are viewable by owner" 
    ON public.bookmarks FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create bookmarks" 
    ON public.bookmarks FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks" 
    ON public.bookmarks FOR DELETE 
    USING (auth.uid() = user_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookmarks;
