-- =======================================================
-- PART 1: SCHEMA CHANGES (Run this first if Part 2 fails)
-- =======================================================

-- 1. ENUM TİPİNİ GÜVENLİ OLUŞTUR
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_status') THEN
        CREATE TYPE "public"."event_status" AS ENUM ('draft', 'published', 'archived');
    END IF;
END $$;

-- 2. SÜTUNLARI EKLE
ALTER TABLE "public"."events"
ADD COLUMN IF NOT EXISTS "status" "public"."event_status" DEFAULT 'draft' NOT NULL;

ALTER TABLE "public"."events"
ADD COLUMN IF NOT EXISTS "organizer_id" uuid REFERENCES auth.users(id);

-- =======================================================
-- PART 2: DATA & RLS (Run after Part 1 is committed)
-- =======================================================

-- 3. MEVCUT ETKİNLİKLERİ GÜNCELLE
-- Yeni eklenen sütun varsayılan olarak 'draft' geldiği için eski kayıtları 'published' yapıyoruz.
UPDATE "public"."events" 
SET "status" = 'published' 
WHERE "status" = 'draft'; 

-- 4. DÖKÜMANTASYON
COMMENT ON COLUMN "public"."events"."status" IS 'Event visibility: draft (hidden), published (visible), archived (hidden)';

-- 5. RLS GÜNCELLEMESİ
-- Mevcut politikaları temizle
DROP POLICY IF EXISTS "Events are viewable by everyone" ON public.events;
DROP POLICY IF EXISTS "Public events are viewable by everyone" ON public.events;
DROP POLICY IF EXISTS "Public events are viewable based on status" ON public.events;
DROP POLICY IF EXISTS "Users can insert their own events if authorized" ON public.events;
DROP POLICY IF EXISTS "Organizers and Admins can update events" ON public.events;

-- YENİ GÜVENLİ POLİTİKALAR
CREATE POLICY "Public events are viewable based on status"
ON public.events
FOR SELECT
USING (
  status = 'published' OR 
  auth.uid() = organizer_id OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('instructor', 'admin')
  )
);

CREATE POLICY "Users can insert their own events if authorized"
ON public.events
FOR INSERT
WITH CHECK (
  auth.uid() = organizer_id OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('instructor', 'admin')
  )
);

CREATE POLICY "Organizers and Admins can update events"
ON public.events
FOR UPDATE
USING (
  auth.uid() = organizer_id OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('instructor', 'admin')
  )
);
