-- ================================================================
-- 🩹 FIX: INFINITE RECURSION IN PROFILES POLICY
-- ================================================================

-- 1. Create a SECURITY DEFINER function to check staff role
--    This avoids RLS recursion when querying public.profiles inside the policy.
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'instructor')
  );
END;
$$;

-- 2. Update the Profiles Policy to use the safe function
DROP POLICY IF EXISTS "Profiles viewable by self and co-members" ON public.profiles;

CREATE POLICY "Profiles viewable by self and co-members"
ON public.profiles FOR SELECT
USING (
    -- 1. My own profile
    id = auth.uid()
    
    -- 2. Someone I share a community with
    OR public.shares_community_with(id)
    
    -- 3. Target is a Member of a PUBLIC community
    OR EXISTS (
        SELECT 1 FROM public.memberships m
        JOIN public.communities c ON m.community_id = c.id
        WHERE m.user_id = profiles.id
        AND c.is_public = true
    )
    
    -- 4. Target is an Owner of a PUBLIC community
    OR EXISTS (
        SELECT 1 FROM public.communities c
        WHERE c.owner_id = profiles.id
        AND c.is_public = true
    )
    
    -- 5. STAFF OVERRIDE (Using safe function)
    OR public.is_staff()
);
