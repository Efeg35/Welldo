-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE user_role AS ENUM ('member', 'instructor', 'admin');
CREATE TYPE event_type AS ENUM ('online_zoom', 'physical');
CREATE TYPE membership_status AS ENUM ('active', 'cancelled', 'past_due');

-- ============================================
-- PROFILES TABLE (extends auth.users)
-- ============================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    role user_role DEFAULT 'member',
    iyzico_sub_merchant_key TEXT, -- For instructors (Marketplace)
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public profiles are viewable by everyone" 
    ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" 
    ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- COMMUNITIES TABLE
-- ============================================
CREATE TABLE public.communities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    subscription_price DECIMAL(10,2) DEFAULT 0,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Communities are viewable by everyone" 
    ON public.communities FOR SELECT USING (true);

CREATE POLICY "Instructors can create communities" 
    ON public.communities FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'instructor'
        )
    );

CREATE POLICY "Owners can update their communities" 
    ON public.communities FOR UPDATE 
    USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete their communities" 
    ON public.communities FOR DELETE 
    USING (owner_id = auth.uid());

-- ============================================
-- CHANNELS TABLE (Chat rooms within communities)
-- ============================================
CREATE TABLE public.channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Channels are viewable by community members" 
    ON public.channels FOR SELECT USING (true);

-- ============================================
-- MESSAGES TABLE
-- ============================================
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Messages are viewable by everyone" 
    ON public.messages FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert messages" 
    ON public.messages FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- MEMBERSHIPS TABLE (Subscriptions)
-- ============================================
CREATE TABLE public.memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
    status membership_status DEFAULT 'active',
    iyzico_subscription_ref TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, community_id)
);

ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own memberships" 
    ON public.memberships FOR SELECT 
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert memberships" 
    ON public.memberships FOR INSERT 
    WITH CHECK (user_id = auth.uid());

-- ============================================
-- EVENTS TABLE
-- ============================================
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    event_type event_type NOT NULL,
    location_address TEXT, -- For physical events
    zoom_meeting_id TEXT,  -- For online events
    zoom_password TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    ticket_price DECIMAL(10,2) DEFAULT 0,
    max_attendees INTEGER,
    cover_image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events are viewable by everyone" 
    ON public.events FOR SELECT USING (true);

CREATE POLICY "Community owners can manage events" 
    ON public.events FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.communities 
            WHERE id = community_id AND owner_id = auth.uid()
        )
    );

-- ============================================
-- TICKETS TABLE (with QR code token)
-- ============================================
CREATE TABLE public.tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    qr_code_token UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    checked_in BOOLEAN DEFAULT false,
    checked_in_at TIMESTAMPTZ,
    iyzico_payment_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tickets" 
    ON public.tickets FOR SELECT 
    USING (user_id = auth.uid());

CREATE POLICY "Event owners can view all tickets" 
    ON public.tickets FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.events e
            JOIN public.communities c ON e.community_id = c.id
            WHERE e.id = event_id AND c.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can purchase tickets" 
    ON public.tickets FOR INSERT 
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Event owners can update tickets (check-in)" 
    ON public.tickets FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.events e
            JOIN public.communities c ON e.community_id = c.id
            WHERE e.id = event_id AND c.owner_id = auth.uid()
        )
    );

-- ============================================
-- GAMIFICATION TABLE
-- ============================================
CREATE TABLE public.gamification (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
    points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, community_id)
);

ALTER TABLE public.gamification ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gamification is viewable by everyone" 
    ON public.gamification FOR SELECT USING (true);

-- ============================================
-- FUNCTION: Auto-create profile on user signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'member')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- REALTIME: Enable for chat
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
