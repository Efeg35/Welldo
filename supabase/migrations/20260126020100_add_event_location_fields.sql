-- =======================================================
-- EVENTS GÜNCELLEMESİ - PART 2: YENİ SÜTUNLAR
-- =======================================================
-- ENUM değeri önceki migration'da eklendi, şimdi güvenle kullanabiliriz.

-- 1. YENİ SÜTUNLARI EKLE
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS event_url TEXT,
ADD COLUMN IF NOT EXISTS live_stream_settings JSONB DEFAULT '{}'::jsonb; 

-- 2. CHECK CONSTRAINT GÜNCELLEMESİ (Güvenlik Ağı)
-- Eski kuralı kaldır
ALTER TABLE public.events
DROP CONSTRAINT IF EXISTS events_event_type_check;

-- Yeni kuralı ekle
ALTER TABLE public.events
ADD CONSTRAINT events_event_type_check 
CHECK (event_type IN ('online_zoom', 'physical', 'tbd', 'welldo_live'));

-- 3. DÖKÜMANTASYON
COMMENT ON COLUMN public.events.event_url IS 'URL for online events (Zoom, YouTube, etc.)';
COMMENT ON COLUMN public.events.live_stream_settings IS 'Settings for WellDo Live Stream (visibility, chat, recording)';
