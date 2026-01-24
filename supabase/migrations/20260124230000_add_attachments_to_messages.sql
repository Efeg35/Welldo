-- =======================================================
-- GARANTİLİ MESAJ TABLOSU (ANTIGRAVITY UYUMLU)
-- =======================================================

-- 1. Tabloyu oluştur (Eğer yoksa)
-- Antigravity'nin kodunun çalışması için bu tablo şart.
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Attachments (Dosya) sütununu ekle (Eğer yoksa)
-- Senin Antigravity'den aldığın komutun gelişmiş hali.
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb;

-- 3. GÜVENLİK (RLS) - Eğer tablo yeni oluştuysa açık kalsın
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Politikaları temizle (Hata vermemesi için)
DROP POLICY IF EXISTS "Public access to messages" ON public.messages;
DROP POLICY IF EXISTS "User can insert messages" ON public.messages;

-- A. Okuma İzni (Basitçe herkes görsün şimdilik)
CREATE POLICY "Public access to messages"
ON public.messages FOR SELECT
USING (true);

-- B. Yazma İzni (Giriş yapmış kullanıcılar)
CREATE POLICY "User can insert messages"
ON public.messages FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- C. Silme İzni (Kendi mesajı)
DROP POLICY IF EXISTS "User can delete own messages" ON public.messages;
CREATE POLICY "User can delete own messages"
ON public.messages FOR DELETE
USING (auth.uid() = user_id);

-- 4. REALTIME (Canlı Sohbet)
-- Mesajlaşmanın anlık çalışması için bu şart.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;
