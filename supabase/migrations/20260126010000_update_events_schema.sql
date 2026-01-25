-- =======================================================
-- ETKİNLİK GÜNCELLEMESİ (TEKRARLAYAN ETKİNLİKLER)
-- =======================================================

-- 1. Enum'a 'tbd' (To Be Determined) ekle
ALTER TYPE "public"."event_type" ADD VALUE IF NOT EXISTS 'tbd';

-- 2. Recurrence (Tekrar) sütununu ekle
ALTER TABLE "public"."events" 
ADD COLUMN IF NOT EXISTS "recurrence" text DEFAULT 'none' NOT NULL;

-- 3. GÜVENLİK KİLİDİ (CHECK CONSTRAINT) 🛡️
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'events_recurrence_check'
  ) THEN
    ALTER TABLE "public"."events" 
    ADD CONSTRAINT events_recurrence_check 
    CHECK (recurrence IN ('none', 'daily', 'weekdays', 'weekly', 'biweekly', 'monthly'));
  END IF;
END $$;

-- 4. Açıklama
COMMENT ON COLUMN "public"."events"."recurrence" IS 'Recurrence rule: none, daily, weekdays, weekly, biweekly, monthly';
