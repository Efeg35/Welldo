-- Create Conversations table for DMs
CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Participants in a conversation
CREATE TABLE public.conversation_participants (
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    last_read_at TIMESTAMPTZ DEFAULT NOW(),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (conversation_id, user_id)
);

-- DM Messages
CREATE TABLE public.direct_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Policies for Conversations
CREATE POLICY "Users can view conversations they are part of" 
    ON public.conversations FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants 
            WHERE conversation_id = id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create conversations" 
    ON public.conversations FOR INSERT 
    WITH CHECK (true);

-- Policies for Participants
CREATE POLICY "Users can view participants of their conversations" 
    ON public.conversation_participants FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp
            WHERE cp.conversation_id = conversation_id AND cp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can add participants (including themselves)" 
    ON public.conversation_participants FOR INSERT 
    WITH CHECK (true); -- Simplified for now, should ideally restrict to mutual connections

-- Policies for Direct Messages
CREATE POLICY "Users can view messages in their conversations" 
    ON public.direct_messages FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants 
            WHERE conversation_id = direct_messages.conversation_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can send messages to their conversations" 
    ON public.direct_messages FOR INSERT 
    WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.conversation_participants 
            WHERE conversation_id = direct_messages.conversation_id AND user_id = auth.uid()
        )
    );

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
