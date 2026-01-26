-- =======================================================
-- EVENTS & BOOKMARKS GÜNCELLEMESİ
-- =======================================================

-- 1. Events: Pinleme Özelliği
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;

-- 2. Bookmarks: Yapıyı Değiştir (Post ID zorunluluğunu kaldır)
ALTER TABLE public.bookmarks DROP CONSTRAINT IF EXISTS bookmarks_pkey;
ALTER TABLE public.bookmarks ALTER COLUMN post_id DROP NOT NULL;

-- 3. Bookmarks: Event ID Ekle
ALTER TABLE public.bookmarks ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE CASCADE;

-- 4. Bookmarks: Check Constraint (Ya Post Ya Event olmalı, ikisi boş olamaz, ikisi dolu olamaz)
-- Önce eski constraint varsa temizle
ALTER TABLE public.bookmarks DROP CONSTRAINT IF EXISTS bookmarks_post_or_event_check;

ALTER TABLE public.bookmarks ADD CONSTRAINT bookmarks_post_or_event_check CHECK (
    (post_id IS NOT NULL AND event_id IS NULL) OR 
    (post_id IS NULL AND event_id IS NOT NULL)
);

-- 5. Bookmarks: Yeni Primary Key (UUID)
-- Mevcut satırlara otomatik ID atayarak ekler.
ALTER TABLE public.bookmarks ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid() PRIMARY KEY;

-- 6. 🚨 KRİTİK GÜVENLİK: TEKİLLİK İNDEKSLERİ 🚨
-- Bir kullanıcı aynı postu/etkinliği 2 kere bookmarklayamasın diye partial index ekliyoruz.
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookmarks_unique_post 
ON public.bookmarks(user_id, post_id) WHERE post_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_bookmarks_unique_event 
ON public.bookmarks(user_id, event_id) WHERE event_id IS NOT NULL;
