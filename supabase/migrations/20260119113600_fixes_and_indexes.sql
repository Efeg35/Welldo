-- ============================================
-- 1. PROFILES & COMMERCIAL UPDATES
-- ============================================
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 10.00,
ADD COLUMN IF NOT EXISTS tax_office TEXT;

-- ============================================
-- 2. MESSAGES SECURITY (RLS FIX)
-- ============================================
-- Drop the insecure "viewable by everyone" policy if it exists
DROP POLICY IF EXISTS "Messages are viewable by everyone" ON public.messages;

-- Create stricter policy: Only active community members can view messages in that community's channels
CREATE POLICY "Messages viewable by community members" 
ON public.messages FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.memberships m
    JOIN public.channels c ON m.community_id = c.community_id
    WHERE c.id = messages.channel_id 
    AND m.user_id = auth.uid() 
    AND m.status = 'active'
  )
);

-- ============================================
-- 3. GAMIFICATION FUNCTION (Secure RPC)
-- ============================================
CREATE OR REPLACE FUNCTION public.add_points(
    p_user_id UUID,
    p_community_id UUID,
    p_points INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_points INTEGER;
    new_points INTEGER;
    new_level INTEGER;
    result JSONB;
BEGIN
    SELECT points INTO current_points
    FROM public.gamification
    WHERE user_id = p_user_id AND community_id = p_community_id;

    IF NOT FOUND THEN
        new_points := p_points;
        new_level := 1;
        
        INSERT INTO public.gamification (user_id, community_id, points, level)
        VALUES (p_user_id, p_community_id, new_points, new_level);
    ELSE
        new_points := current_points + p_points;
        new_level := (new_points / 1000) + 1;
        
        UPDATE public.gamification
        SET points = new_points, level = new_level, updated_at = NOW()
        WHERE user_id = p_user_id AND community_id = p_community_id;
    END IF;

    result := json_build_object(
        'success', true,
        'points', new_points,
        'level', new_level
    );

    RETURN result;
END;
$$;

-- ============================================
-- 4. PERFORMANCE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON public.messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_user_event ON public.tickets(user_id, event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_qr_token ON public.tickets(qr_code_token);
CREATE INDEX IF NOT EXISTS idx_gamification_community_points ON public.gamification(community_id, points DESC);
