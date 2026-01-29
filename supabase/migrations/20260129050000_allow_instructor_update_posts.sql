-- ================================================================
-- ✨ FEATURE: ADVANCED POST EDITING PERMISSIONS
-- ================================================================

-- 1. Profiles tablosuna 'role' sütunu ekle (Eğer yoksa)
-- Varsayılan olarak herkes 'member' (üye) olsun.
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'member';

-- 2. Mevcut kısıtlı politikayı kaldır
DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
DROP POLICY IF EXISTS "Users and Instructors can update posts" ON public.posts;

-- 3. Yeni GENİŞ KAPSAMLI politikayı oluştur
CREATE POLICY "Users, Instructors and Owners can update posts"
ON public.posts FOR UPDATE
USING (
    -- A. Kendi postuysa
    auth.uid() = user_id 
    
    OR 
    
    -- B. Global 'admin' veya 'instructor' ise (Senin istediğin)
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('instructor', 'admin')
    )
    
    OR
    
    -- C. O topluluğun SAHİBİ ise (Bunu eklemek hayat kurtarır!)
    EXISTS (
        SELECT 1 FROM public.communities c
        WHERE c.id = posts.community_id
        AND c.owner_id = auth.uid()
    )
);

-- ================================================================
-- 🎉 ARTIK EĞİTMENLER VE TOPLULUK SAHİPLERİ POST DÜZENLEYEBİLİR!
-- ================================================================