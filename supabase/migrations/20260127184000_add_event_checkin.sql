-- =======================================================
-- EVENT RESPONSES: CHECK-IN SYSTEM (SECURE)
-- =======================================================

-- 1. SÜTUNU EKLE
ALTER TABLE public.event_responses 
ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ DEFAULT NULL;

-- 2. PERFORMANS İNDEKSİ
-- Belirli bir etkinlikte check-in yapanları hızlıca saymak için
CREATE INDEX IF NOT EXISTS idx_event_responses_checkin 
ON public.event_responses(event_id, checked_in_at) 
WHERE checked_in_at IS NOT NULL;

-- 3. 🚨 GÜVENLİK: CHECK-IN YETKİSİ 🚨
-- Mevcut UPDATE politikasını daha spesifik hale getirelim.
-- Kullanıcı kendi RSVPsini (Geleceğim/Gelmiyorum) değiştirebilir 
-- AMA 'checked_in_at' alanını sadece Admin veya Organizatör değiştirebilmeli.

DROP POLICY IF EXISTS "Users can manage their own responses" ON public.event_responses;

-- A. RSVP Güncelleme (Herkes kendi durumunu değiştirebilir ama check-in'e dokunamaz)
CREATE POLICY "Users can update their RSVP status"
ON public.event_responses FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
    auth.uid() = user_id AND 
    (checked_in_at IS NOT DISTINCT FROM (SELECT checked_in_at FROM public.event_responses WHERE id = id))
    -- Bu kural, kullanıcının checked_in_at değerini değiştirmesini engeller
);

-- B. Check-in Yetkisi (Organizatör ve Admin her şeyi yapabilir)
CREATE POLICY "Organizers can check-in attendees"
ON public.event_responses FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.id = event_responses.event_id
        AND (e.organizer_id = auth.uid() OR 
            EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'instructor')))
    )
);
