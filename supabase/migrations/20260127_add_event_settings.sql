-- =======================================================
-- EVENTS: GELİŞMİŞ AYARLAR (SETTINGS JSONB)
-- =======================================================

-- 1. Sütunu "NOT NULL" Güvencesiyle Ekle
-- Varsayılan değer '{}' (boş obje) olsun ki asla NULL gelmesin.
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb NOT NULL;

-- 2. Varsayılan Ayarları Doldur (Migration)
-- Henüz ayarı yapılmamış (boş) olan etkinlikleri standart ayarlarla güncelle.
UPDATE public.events 
SET settings = '{
  "reminders": { "in_app_enabled": true, "email_enabled": true },
  "permissions": { "comments_disabled": false, "hide_attendees": false },
  "attendees": { "rsvp_limit": null, "allow_guests": false },
  "seo": { "meta_title": null, "meta_description": null, "og_image_url": null }
}'::jsonb
WHERE settings = '{}'::jsonb;

-- 3. Dökümantasyon
COMMENT ON COLUMN public.events.settings IS 'Configuration: reminders, permissions, seo, attendees limits etc.';
