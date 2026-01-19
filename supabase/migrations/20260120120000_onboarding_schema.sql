-- Create Plans Table
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE, -- 'starter', 'pro', etc.
    price DECIMAL(10,2) DEFAULT 0,
    features JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Starter Plan
INSERT INTO public.plans (name, price, features)
VALUES ('starter', 0, '{"commission_rate": 0.15}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Create User Plans Table
CREATE TABLE IF NOT EXISTS public.user_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    plan_id UUID REFERENCES public.plans(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'active', -- 'active', 'cancelled'
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for new tables
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Plans are viewable by everyone" ON public.plans;
CREATE POLICY "Plans are viewable by everyone" ON public.plans FOR SELECT USING (true);

ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own plans" ON public.user_plans;
CREATE POLICY "Users can view their own plans" ON public.user_plans FOR SELECT USING (user_id = auth.uid());

-- Update Communities Table
ALTER TABLE public.communities
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS enabled_features JSONB DEFAULT '{"discussions": true, "events": true, "chat": true, "courses": false, "gamification": true}'::jsonb;
