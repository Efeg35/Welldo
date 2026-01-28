-- =======================================================
-- LIKES & BOOKMARKS: COMMENT SUPPORT (FULL POLYMORPHIC)
-- =======================================================

-- 1. SÜTUNLARI EKLE
ALTER TABLE public.likes ADD COLUMN IF NOT EXISTS comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE;
ALTER TABLE public.bookmarks ADD COLUMN IF NOT EXISTS comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE;

-- 2. TEKİLLİK (UNIQUE) INDEXLERİ
-- Bir kullanıcı bir yorumu sadece bir kez beğenebilir / kaydedebilir.
CREATE UNIQUE INDEX IF NOT EXISTS idx_likes_unique_comment 
ON public.likes(user_id, comment_id) WHERE comment_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_bookmarks_unique_comment 
ON public.bookmarks(user_id, comment_id) WHERE comment_id IS NOT NULL;

-- 3. KRİTİK: CHECK CONSTRAINT GÜNCELLEMESİ (LIKES) 🛡️
-- Eski 2'li kuralı sil, 3'lü kuralı ekle.
ALTER TABLE public.likes DROP CONSTRAINT IF EXISTS likes_target_check;

ALTER TABLE public.likes ADD CONSTRAINT likes_target_check 
CHECK (
  (post_id IS NOT NULL AND event_id IS NULL AND comment_id IS NULL) OR 
  (post_id IS NULL AND event_id IS NOT NULL AND comment_id IS NULL) OR
  (post_id IS NULL AND event_id IS NULL AND comment_id IS NOT NULL)
);

-- 4. KRİTİK: CHECK CONSTRAINT GÜNCELLEMESİ (BOOKMARKS) 🛡️
ALTER TABLE public.bookmarks DROP CONSTRAINT IF EXISTS bookmarks_post_or_event_check;
ALTER TABLE public.bookmarks DROP CONSTRAINT IF EXISTS bookmarks_target_check;

ALTER TABLE public.bookmarks ADD CONSTRAINT bookmarks_target_check 
CHECK (
  (post_id IS NOT NULL AND event_id IS NULL AND comment_id IS NULL) OR 
  (post_id IS NULL AND event_id IS NOT NULL AND comment_id IS NULL) OR
  (post_id IS NULL AND event_id IS NULL AND comment_id IS NOT NULL)
);

-- 5. PERFORMANS INDEXLERİ
CREATE INDEX IF NOT EXISTS idx_likes_comment_id ON public.likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_comment_id ON public.bookmarks(comment_id);
