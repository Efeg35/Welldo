-- =======================================================
-- PAYWALL SİSTEMİ GÜNCELLEMESİ (KANAL DESTEĞİ)
-- =======================================================

-- 1. TABLO YAPISINI GÜNCELLE
-- Channel ID ekle (Eğer yoksa)
ALTER TABLE public.paywalls 
ADD COLUMN IF NOT EXISTS channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE;

-- Course ID zorunluluğunu kaldır (Artık sadece kanal paywall'u olabilir)
ALTER TABLE public.paywalls 
ALTER COLUMN course_id DROP NOT NULL;

-- 2. CONSTRAINT (KISITLAMA) EKLE
-- Ya course_id dolu olacak, ya channel_id. İkisi aynı anda olamaz veya boş olamaz.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'paywalls_target_check'
  ) THEN
    ALTER TABLE public.paywalls 
    ADD CONSTRAINT paywalls_target_check 
    CHECK (
      (course_id IS NOT NULL AND channel_id IS NULL) OR 
      (course_id IS NULL AND channel_id IS NOT NULL)
    );
  END IF;
END $$;

-- 3. UNIQUE INDEX (Bir kanalın sadece bir paywall'u olsun)
CREATE UNIQUE INDEX IF NOT EXISTS paywalls_channel_id_key 
ON public.paywalls(channel_id) 
WHERE channel_id IS NOT NULL;

-- 4. GÜVENLİK POLİTİKALARI (RLS)

-- A. Yönetim İzni (Instructors can manage paywalls)
DROP POLICY IF EXISTS "Instructors can manage paywalls" ON public.paywalls;

CREATE POLICY "Instructors can manage paywalls"
  ON public.paywalls
  FOR ALL
  TO authenticated
  USING (
    -- DURUM 1: Kurs Paywall'u ise
    (course_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.courses c
      JOIN public.channels ch ON c.channel_id = ch.id
      JOIN public.communities com ON ch.community_id = com.id
      WHERE c.id = paywalls.course_id
      AND com.owner_id = auth.uid()
    ))
    OR
    -- DURUM 2: Kanal Paywall'u ise
    (channel_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.channels ch
      JOIN public.communities com ON ch.community_id = com.id
      WHERE ch.id = paywalls.channel_id
      AND com.owner_id = auth.uid()
    ))
  );

-- D. Satın Almaları Görme (Instructors can view purchases)
DROP POLICY IF EXISTS "Instructors can view purchases" ON public.paywall_purchases;

CREATE POLICY "Instructors can view purchases"
  ON public.paywall_purchases
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.paywalls pw
      -- Kurs Bağlantıları
      LEFT JOIN public.courses c ON c.id = pw.course_id
      LEFT JOIN public.channels ch_course ON c.channel_id = ch_course.id
      LEFT JOIN public.communities com_course ON ch_course.community_id = com_course.id
      -- Kanal Bağlantıları
      LEFT JOIN public.channels ch_direct ON pw.channel_id = ch_direct.id
      LEFT JOIN public.communities com_direct ON ch_direct.community_id = com_direct.id
      
      WHERE pw.id = paywall_purchases.paywall_id
      AND (
        -- Kurs ise sahibi kontrolü
        (pw.course_id IS NOT NULL AND com_course.owner_id = auth.uid()) 
        OR
        -- Kanal ise sahibi kontrolü
        (pw.channel_id IS NOT NULL AND com_direct.owner_id = auth.uid())
      )
    )
  );
