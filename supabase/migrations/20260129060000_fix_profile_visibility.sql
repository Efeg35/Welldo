-- ================================================================
-- 🔓 FIX: PROFILE VISIBILITY & RLS (ADVANCED)
-- ================================================================

-- 1. Fonksiyonu Güncelle (Owner mantığını kapsayacak şekilde)
CREATE OR REPLACE FUNCTION public.shares_community_with(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    -- A. İkimiz de aynı yerde üyeyiz
    SELECT 1 FROM public.memberships m1
    JOIN public.memberships m2 ON m1.community_id = m2.community_id
    WHERE m1.user_id = auth.uid()
    AND m2.user_id = _user_id
  )
  OR EXISTS (
    -- B. Ben Sahibim, O Üye
    SELECT 1 FROM public.communities c
    JOIN public.memberships m ON c.id = m.community_id
    WHERE c.owner_id = auth.uid()
    AND m.user_id = _user_id
  )
  OR EXISTS (
    -- C. Ben Üyeyim, O Sahip
    SELECT 1 FROM public.communities c
    JOIN public.memberships m ON c.id = m.community_id
    WHERE m.user_id = auth.uid()
    AND c.owner_id = _user_id
  );
END;
$$;

-- 2. Profil Politikasını Güncelle (Public ve Admin desteğiyle)
DROP POLICY IF EXISTS "Profiles viewable by self and co-members" ON public.profiles;

CREATE POLICY "Profiles viewable by self and co-members"
ON public.profiles FOR SELECT
USING (
    -- 1. Kendi profilim (En başta olmalı!)
    id = auth.uid()
    
    -- 2. Ortak topluluğumuz var (Gizli topluluklar için)
    OR public.shares_community_with(id)
    
    -- 3. Hedef kişi PUBLIC bir topluluğun üyesi
    OR EXISTS (
        SELECT 1 FROM public.memberships m
        JOIN public.communities c ON m.community_id = c.id
        WHERE m.user_id = profiles.id
        AND c.is_public = true
    )
    
    -- 4. Hedef kişi PUBLIC bir topluluğun sahibi
    OR EXISTS (
        SELECT 1 FROM public.communities c
        WHERE c.owner_id = profiles.id
        AND c.is_public = true
    )
    
    -- 5. BEN Admin veya Eğitmensem herkesi görürüm
    OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'instructor')
    )
);

-- ================================================================
-- 🎉 PROFİLLER ARTIK DAHA SOSYAL VE GÖRÜNÜR!
-- ================================================================