-- =======================================================
-- DERS MEDYA DEPOLAMA ALANI (SECURE STORAGE)
-- =======================================================

-- 1. Bucket'ı Oluştur (Yoksa)
INSERT INTO storage.buckets (id, name, public)
VALUES ('lesson_media', 'lesson_media', true) -- 'true' = Linki alan izleyebilir
ON CONFLICT (id) DO NOTHING;

-- Eski/Hatalı politikalar varsa temizle (Çakışma olmasın)
DROP POLICY IF EXISTS "Allow authenticated uploads to lesson_media" ON storage.objects;
DROP POLICY IF EXISTS "Allow public viewing of lesson_media" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletions from lesson_media" ON storage.objects;
DROP POLICY IF EXISTS "Give public access to lesson_media" ON storage.objects;

-- 2. İZLEME İZNİ (Herkese Açık)
-- Herkes (Public) dosya linkine sahipse videoyu izleyebilir.
CREATE POLICY "Give public access to lesson_media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'lesson_media');

-- 3. YÜKLEME İZNİ (Sadece Eğitmenler) 🛡️
CREATE POLICY "Allow instructors to upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'lesson_media'
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'instructor' -- KİLİT NOKTA BURASI
    )
);

-- 4. SİLME İZNİ (Sadece Eğitmenler) 🛡️
CREATE POLICY "Allow instructors to delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'lesson_media'
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'instructor'
    )
);

-- 5. GÜNCELLEME İZNİ (Dosya Değiştirme - Sadece Eğitmenler)
CREATE POLICY "Allow instructors to update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'lesson_media'
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'instructor'
    )
);
