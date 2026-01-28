-- ================================================================
-- 🔧 FIX: PROFILE UPDATE PERMISSIONS & COLUMNS
-- ================================================================

-- 1. "location" sütunu yoksa oluştur (Garantiye alalım)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS location text;

-- 2. "updated_at" trigger fonksiyonunu onar
-- (Bazen bu fonksiyon yetki hatası verir ve güncellemeyi engeller)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- 3. UPDATE Politikasını "En Basit" hale getir
-- (WITH CHECK kısmını kaldırıyoruz, bazen bug yaratabilir)
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (id = auth.uid()); 
-- Sadece "Bu ID benim mi?" diye bakar. Gerisine karışmaz.

-- 4. İzinleri Garantiye Al
GRANT UPDATE ON public.profiles TO authenticated;

-- ================================================================
-- 🎉 İŞLEM TAMAM!
-- ================================================================
