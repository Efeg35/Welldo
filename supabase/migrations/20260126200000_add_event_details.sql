-- =======================================================
-- EVENTS: DOSYA EKLERİ (ATTACHMENTS)
-- =======================================================

-- 1. Sütunu Güvenli Şekilde Ekle
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- 2. Dökümantasyon (Ne formatta veri tutacağımızı hatırlayalım)
COMMENT ON COLUMN public.events.attachments IS 'Array of file objects: [{ name, url, size, type }]';
