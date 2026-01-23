-- =======================================================
-- QUIZ MEDYA DEPOLAMA ALANI (SECURE STORAGE)
-- =======================================================

-- 1. Bucket'ı Oluştur (Yoksa)
INSERT INTO storage.buckets (id, name, public)
VALUES ('quiz_media', 'quiz_media', true)
ON CONFLICT (id) DO NOTHING;

-- 2. ESKİ POLİTİKALARI TEMİZLE (Hata vermemesi için güvenlik önlemi)
DROP POLICY IF EXISTS "Give public access to quiz_media" ON storage.objects;
DROP POLICY IF EXISTS "Allow instructors to upload quiz media" ON storage.objects;
DROP POLICY IF EXISTS "Allow instructors to delete quiz media" ON storage.objects;
DROP POLICY IF EXISTS "Allow instructors to update quiz media" ON storage.objects;

-- 3. İZLEME İZNİ (Herkese Açık - Soruları çözen herkes görebilsin)
CREATE POLICY "Give public access to quiz_media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'quiz_media');

-- 4. YÜKLEME İZNİ (Sadece Eğitmenler) 🛡️
CREATE POLICY "Allow instructors to upload quiz media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'quiz_media'
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'instructor'
    )
);

-- 5. SİLME İZNİ (Sadece Eğitmenler) 🛡️
CREATE POLICY "Allow instructors to delete quiz media"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'quiz_media'
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'instructor'
    )
);

-- 6. GÜNCELLEME İZNİ (Sadece Eğitmenler) 🛡️
CREATE POLICY "Allow instructors to update quiz media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'quiz_media'
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'instructor'
    )
);
