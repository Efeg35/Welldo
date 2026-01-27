-- =======================================================
-- EVENTS: PRO EMAIL SCHEDULES (GELİŞMİŞ & GÜVENLİ)
-- =======================================================

-- 1. TABLOYU OLUŞTUR (Kısıtlamalarla Birlikte)
CREATE TABLE IF NOT EXISTS public.event_email_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    -- Hedef kitleyi sınırla
    audience TEXT DEFAULT 'going' CHECK (audience IN ('going', 'invited', 'all', 'not_responded')),
    -- Durumları sınırla
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PERFORMANS INDEXLERİ
-- Event ID'ye göre sorgulama yapacağız
CREATE INDEX IF NOT EXISTS idx_event_email_schedules_event_id ON public.event_email_schedules(event_id);
-- "Zamanı gelmiş ve gönderilmemiş" mailleri bulmak için bu index şart! ⚡
CREATE INDEX IF NOT EXISTS idx_event_email_schedules_processing ON public.event_email_schedules(status, scheduled_at) WHERE status = 'pending';

-- 3. TRIGGER: updated_at GÜNCELLEMESİ
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_event_email_schedules_modtime ON public.event_email_schedules;
CREATE TRIGGER update_event_email_schedules_modtime
    BEFORE UPDATE ON public.event_email_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. 🚨 RLS (GÜVENLİK) AYARLARI 🚨
ALTER TABLE public.event_email_schedules ENABLE ROW LEVEL SECURITY;

-- Temizlik
DROP POLICY IF EXISTS "Organizers manage email schedules" ON public.event_email_schedules;

-- KURAL: Sadece Organizatörler ve Adminler Yönetebilir
CREATE POLICY "Organizers manage email schedules"
ON public.event_email_schedules
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.events
        WHERE id = event_email_schedules.event_id
        AND (
            organizer_id = auth.uid() -- Etkinliğin sahibi benim
            OR 
            EXISTS ( -- Veya ben adminim
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid() AND role IN ('instructor', 'admin')
            )
        )
    )
);
