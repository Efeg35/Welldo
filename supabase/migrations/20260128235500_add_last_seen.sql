-- ================================================================
-- ADD LAST_SEEN_AT TO PROFILES
-- ================================================================

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT NOW();

-- Policy is already covered by "Users can update their own profile"
-- but ensuring we don't have issues.
