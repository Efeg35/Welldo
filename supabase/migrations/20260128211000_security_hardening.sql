-- =======================================================
-- SECURITY HARDENING: STRICT ISOLATION & MULTI-TENANCY
-- =======================================================

-- 1. HARDEN CHANNELS
-- Drop the overly permissive "viewable by everyone" policy
DROP POLICY IF EXISTS "Channels are viewable by community members" ON public.channels;
DROP POLICY IF EXISTS "Channels viewable by members" ON public.channels;

-- Create strict policy
CREATE POLICY "Channels are viewable by members and public"
ON public.channels FOR SELECT
USING (
  -- 1. Community Owner
  EXISTS (
    SELECT 1 FROM public.communities c
    WHERE c.id = channels.community_id
    AND c.owner_id = auth.uid()
  )
  OR
  -- 2. Community Member
  EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.community_id = channels.community_id
    AND m.user_id = auth.uid()
  )
  OR
  -- 3. Public Community (Optional: Depending on strict privacy needs)
  -- For now, we allow seeing channels of PUBLIC communities to visitors.
  -- If strict private isolation is needed even for public communities (until join), remove this.
  -- User asked "My things should be private". If they set community to Private, this clause won't match, so it's safe.
  EXISTS (
    SELECT 1 FROM public.communities c
    WHERE c.id = channels.community_id
    AND c.is_public = true
  )
);

-- 2. HARDEN EVENTS
DROP POLICY IF EXISTS "Events are viewable by everyone" ON public.events;

CREATE POLICY "Events are viewable by members and public"
ON public.events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.communities c
    WHERE c.id = events.community_id
    AND c.owner_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.community_id = events.community_id
    AND m.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.communities c
    WHERE c.id = events.community_id
    AND c.is_public = true
  )
);

-- 3. HARDEN MEMBERSHIPS (CRITICAL FOR "Cannot see other members")
-- Existing policies: "Users can view their own memberships" (Good)
-- Missing: "Owners can view their community's memberships"
DROP POLICY IF EXISTS "Community owners can view memberships" ON public.memberships;

CREATE POLICY "Community owners can view memberships"
ON public.memberships FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.communities c
    WHERE c.id = memberships.community_id
    AND c.owner_id = auth.uid()
  )
);

-- Also allow members to see other members of SAME community (for Directory)
-- This is needed for the Members Page to work for regular members.
-- But strict isolation means they CANNOT see members of OTHER communities.
CREATE POLICY "Members can view co-members"
ON public.memberships FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.community_id = memberships.community_id
    AND m.user_id = auth.uid()
  )
);

-- 4. HARDEN POSTS (If not already done)
-- Check if posts have RLS. Assuming typical setup.
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;

CREATE POLICY "Posts restricted visibility"
ON public.posts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.communities c
    WHERE c.id = posts.community_id
    AND (
      c.is_public = true
      OR c.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.memberships m
        WHERE m.community_id = c.id
        AND m.user_id = auth.uid()
      )
    )
  )
);
