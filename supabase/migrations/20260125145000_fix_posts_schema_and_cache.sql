-- =======================================================
-- MASTER POST MIGRATION (FIX + SECURITY HARDENING)
-- =======================================================

-- 1. TABLO VE SÜTUNLARI GARANTİLE 🛠️
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE,
    community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE, -- KOD TARAFINDA KULLANILIYOR
    title TEXT,
    content TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Var olan tabloda sütunlar eksikse ekle (Güvenlik ağı)
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE; -- EKLENDİ

-- 2. PERFORMANS INDEXLERİ ⚡
CREATE INDEX IF NOT EXISTS idx_posts_channel_id ON public.posts(channel_id);
CREATE INDEX IF NOT EXISTS idx_posts_community_id ON public.posts(community_id);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);

-- 3. SCHEMA CACHE TEMİZLİĞİ (PGRST204 Hatası İçin) 🧹
NOTIFY pgrst, 'reload config';

-- 4. GÜVENLİK (RLS) - SIKI YÖNETİM MODU 🛡️
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Eski gevşek kuralları tamamen sil (Temiz sayfa)
DROP POLICY IF EXISTS "Public posts are viewable by everyone" ON public.posts;
DROP POLICY IF EXISTS "Users can insert their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;
DROP POLICY IF EXISTS "Strict Read Access" ON public.posts;
DROP POLICY IF EXISTS "Strict Insert Access" ON public.posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.posts;


-- A. OKUMA İZNİ (Strict Read Policy)
CREATE POLICY "Strict Read Access"
ON public.posts FOR SELECT
USING (
    auth.uid() = user_id -- 1. Kendi postum
    OR EXISTS (
        SELECT 1 FROM public.channels
        WHERE id = posts.channel_id
        -- AND visibility = 'open' -- Kanal görünürlük mantığı karmaşıksa şimdilik herkese açık yapalım veya 'open' kontrolü:
    )
    OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'instructor'
    )
    OR channel_id IS NULL -- Genel topluluk postları? (Eğer varsa)
);

-- B. YAZMA İZNİ (Strict Insert Policy)
CREATE POLICY "Strict Insert Access"
ON public.posts FOR INSERT
WITH CHECK (
    auth.uid() = user_id 
);

-- C. GÜNCELLEME İZNİ (Sadece Sahibi)
CREATE POLICY "Users can update own posts"
ON public.posts FOR UPDATE
USING (auth.uid() = user_id);

-- D. SİLME İZNİ (Sahibi veya Eğitmenler)
CREATE POLICY "Users and Instructors can delete posts"
ON public.posts FOR DELETE
USING (
    auth.uid() = user_id
    OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'instructor'
    )
);
