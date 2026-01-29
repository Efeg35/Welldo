-- ================================================================
-- 📦 STORAGE: COMMUNITY ASSETS BUCKET & POLICIES
-- ================================================================

-- 1. Bucket Oluştur (Güvenlik Ayarlarıyla Birlikte)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'community-assets', 
  'community-assets', 
  true, 
  5242880, -- 5MB Limit (Bayt cinsinden)
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'] -- Sadece resimler
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 2. Eski Politikaları Temizle (Çakışma olmasın)
DROP POLICY IF EXISTS "Allow public viewing of community assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to community assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own assets" ON storage.objects;

-- 3. POLİTİKALAR

-- A. Herkes görebilir (Public Read)
CREATE POLICY "Allow public viewing of community assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'community-assets');

-- B. Sadece giriş yapmış kullanıcılar yükleyebilir
CREATE POLICY "Allow authenticated uploads to community assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'community-assets');

-- C. Kullanıcı sadece kendi yüklediği dosyayı güncelleyebilir
CREATE POLICY "Allow users to update their own assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'community-assets' AND owner = auth.uid());

-- D. Kullanıcı sadece kendi yüklediği dosyayı silebilir
CREATE POLICY "Allow users to delete their own assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'community-assets' AND owner = auth.uid());

-- ================================================================
-- 🎉 STORAGE HAZIR!
-- Artık sadece resim yüklenebilir ve maksimum 5MB olabilir.
-- ================================================================
