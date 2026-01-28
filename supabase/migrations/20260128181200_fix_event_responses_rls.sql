-- =======================================================
-- FIX: EVENT RESPONSES INSERT & DELETE POLICIES
-- =======================================================

-- 1. ESKİLERİ TEMİZLE
DROP POLICY IF EXISTS "Users can create their own responses" ON public.event_responses;
DROP POLICY IF EXISTS "Users can delete their own responses" ON public.event_responses;

-- 2. INSERT: Kullanıcı kendi adına RSVP oluşturabilir (Geleceğim/Gelmiyorum diyebilir)
CREATE POLICY "Users can create their own responses"
ON public.event_responses FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. DELETE: Kullanıcı kendi RSVP'sini silebilir (Katılmaktan vazgeçebilir)
CREATE POLICY "Users can delete their own responses"
ON public.event_responses FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 4. KONTROL: OKUMA İZNİ (Eğer silindiyse geri getir)
-- Herkes kimlerin katıldığını görebilmeli.
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'event_responses' AND policyname = 'Responses are viewable by everyone'
    ) THEN
        CREATE POLICY "Responses are viewable by everyone"
        ON public.event_responses FOR SELECT
        USING (true);
    END IF;
END $$;
