-- ================================================================
-- ✨ FEATURE: NESTED COMMENTS (REPLIES)
-- ================================================================

-- 1. parent_id sütunu ekle (Kendine referans verir)
ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE;

-- 2. İndeks oluştur (Hızlı cevap listeleme için şart)
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);