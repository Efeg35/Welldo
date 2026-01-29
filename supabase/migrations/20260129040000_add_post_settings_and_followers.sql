-- ================================================================
-- ✨ FEATURE: POST INTERACTIONS & SETTINGS (FIXED)
-- ================================================================

-- 1. Sütunları Ekle
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS topic TEXT;

-- 2. İndeks Oluştur
CREATE INDEX IF NOT EXISTS idx_posts_is_pinned ON public.posts(is_pinned);

-- 3. Post Followers Tablosunu Oluştur (DÜZELTİLEN KISIM BURASI)
CREATE TABLE IF NOT EXISTS public.post_followers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    
    -- 👇 HATALI OLAN: public.auth.users
    -- ✅ DOĞRU OLAN: auth.users
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(post_id, user_id)
);

-- 4. RLS Aktif Et
ALTER TABLE public.post_followers ENABLE ROW LEVEL SECURITY;

-- 5. POLİTİKALAR (Önce temizle, sonra ekle)

-- A. Takip Etme
DROP POLICY IF EXISTS "Users can follow posts" ON public.post_followers;
CREATE POLICY "Users can follow posts"
ON public.post_followers FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- B. Takipten Çıkma
DROP POLICY IF EXISTS "Users can unfollow posts" ON public.post_followers;
CREATE POLICY "Users can unfollow posts"
ON public.post_followers FOR DELETE
USING (auth.uid() = user_id);

-- C. Kendi Takiplerini Görme
DROP POLICY IF EXISTS "Users can view their own follows" ON public.post_followers;
CREATE POLICY "Users can view their own follows"
ON public.post_followers FOR SELECT
USING (auth.uid() = user_id);
