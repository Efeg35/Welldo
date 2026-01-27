-- =======================================================
-- STORAGE: EVENT IMAGES (SECURE & OPTIMIZED)
-- =======================================================

-- 1. BUCKET OLUŞTUR (GÜVENLİK AYARLARIYLA)
-- Resim harici dosya yüklenemesin ve 5MB'ı geçmesin.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'event-images', 
    'event-images', 
    true, 
    5242880, -- 5MB Limit (Byte cinsinden)
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. GÜVENLİK POLİTİKALARI (RLS)
-- Önce eski veya hatalı politikaları temizle
DROP POLICY IF EXISTS "Allow authenticated event image uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public event image viewing" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated event image deletion" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated event image updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow owners to update their images" ON storage.objects;
DROP POLICY IF EXISTS "Allow owners to delete their images" ON storage.objects;

-- A. YÜKLEME (INSERT)
-- Her giriş yapmış kullanıcı resim yükleyebilir.
CREATE POLICY "Allow authenticated event image uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'event-images');

-- B. GÖRÜNTÜLEME (SELECT)
-- Herkes (Giriş yapmamışlar dahil) resimleri görebilir.
CREATE POLICY "Allow public event image viewing"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'event-images');

-- C. GÜNCELLEME (UPDATE) 🚨
-- Sadece dosyanın SAHİBİ (Owner) güncelleyebilir.
CREATE POLICY "Allow owners to update their images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'event-images' AND owner = auth.uid());

-- D. SİLME (DELETE) 🚨
-- Sadece dosyanın SAHİBİ (Owner) silebilir.
CREATE POLICY "Allow owners to delete their images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'event-images' AND owner = auth.uid());
