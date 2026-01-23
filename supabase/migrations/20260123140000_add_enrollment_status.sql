-- =======================================================
-- ÖĞRENCİ KAYIT DURUMU (STATUS)
-- =======================================================

-- 1. Status sütununu ekle (Gelecek için 'expired' ve 'completed' da ekledik)
ALTER TABLE public.user_course_enrollments 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' 
CHECK (status IN ('active', 'revoked', 'expired', 'completed'));

-- 2. Mevcut kayıtları 'active' olarak işaretle (Eski veriler boş kalmasın)
UPDATE public.user_course_enrollments SET status = 'active' WHERE status IS NULL;
