-- =======================================================
-- POSTS: CONTEXT MENU ACTIONS (PIN & SETTINGS)
-- =======================================================

-- 1. Sütunu Ekle: is_pinned
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;

-- 2. Sütunu Ekle: settings (JSONB)
-- NOT NULL ve varsayılan '{}' ile frontend'in patlamasını önlüyoruz.
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb NOT NULL;

-- 3. Performans İndeksi (Partial Index) ⚡
-- Sadece sabitlenmiş postları indeksle.
CREATE INDEX IF NOT EXISTS idx_posts_pinned 
ON public.posts(is_pinned) 
WHERE is_pinned = true;

-- 4. Dökümantasyon
COMMENT ON COLUMN public.posts.settings IS 'Post configurations: { disable_comments: boolean, hide_reactions: boolean }';
