-- Create space_members table to handle manual access to private/secret spaces
CREATE TABLE IF NOT EXISTS public.space_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(channel_id, user_id)
);

-- Enable RLS
ALTER TABLE public.space_members ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own space memberships" 
    ON public.space_members FOR SELECT 
    USING (user_id = auth.uid());

CREATE POLICY "Instructors can manage space memberships" 
    ON public.space_members FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.channels ch
            JOIN public.communities co ON ch.community_id = co.id
            WHERE ch.id = channel_id AND co.owner_id = auth.uid()
        )
    );
