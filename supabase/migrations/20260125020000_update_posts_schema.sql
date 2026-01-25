-- =======================================================
-- POST TABLOSU GÜNCELLEMESİ (FORUM TİPİ KANALLAR İÇİN)
-- =======================================================

-- 1. Title ve Channel ID ekle
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE; 
-- 👆 DÜZELTME: 'CASCADE' yaptık. Kanal silinirse postlar da silinsin.

-- 2. Hız için Index (Bu zaten doğruydu)
CREATE INDEX IF NOT EXISTS idx_posts_channel_id ON public.posts(channel_id);
