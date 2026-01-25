-- =======================================================
-- KANAL OKUMA TAKİBİ (UNREAD INDICATORS)
-- =======================================================

-- 1. Tabloyu Oluştur
CREATE TABLE IF NOT EXISTS public.channel_reads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
    last_read_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(user_id, channel_id) -- Bu satır otomatik index oluşturur!
);

-- 2. Güvenlik (RLS)
ALTER TABLE public.channel_reads ENABLE ROW LEVEL SECURITY;

-- Politikaları Temizle (Hata vermemesi için)
DROP POLICY IF EXISTS "Users can view their own read status" ON public.channel_reads;
DROP POLICY IF EXISTS "Users can insert their own read status" ON public.channel_reads;
DROP POLICY IF EXISTS "Users can update their own read status" ON public.channel_reads;
DROP POLICY IF EXISTS "Users can manage their own read status" ON public.channel_reads;

-- 3. Politikaları Oluştur (Tek bir 'ALL' politikası daha temizdir)
CREATE POLICY "Users can manage their own read status"
    ON public.channel_reads
    FOR ALL -- Select, Insert, Update, Delete hepsini kapsar
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Not: Ekstra INDEX oluşturmaya gerek yok, UNIQUE constraint bunu halletti.
