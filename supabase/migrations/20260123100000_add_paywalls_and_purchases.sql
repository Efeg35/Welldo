-- =======================================================
-- ÖDEME SİSTEMİ (PAYWALLS & IYZICO)
-- =======================================================

-- 1. PAYWALLS TABLOSU (Kurs Fiyatlandırması)
CREATE TABLE IF NOT EXISTS public.paywalls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  currency TEXT DEFAULT 'TRY' NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(course_id) -- Bir kursun tek bir fiyatı olur (MVP için)
);

-- 2. SATIN ALMA KAYITLARI (PURCHASES)
CREATE TABLE IF NOT EXISTS public.paywall_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  paywall_id UUID REFERENCES public.paywalls(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  payment_id TEXT NOT NULL, -- Iyzico'dan dönen işlem ID'si
  amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. IYZICO SUB-MERCHANT KEY (Eğitmenlerin Ödeme Alması İçin)
-- Profil tablosuna Iyzico anahtarını ekle (Yoksa)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'iyzico_sub_merchant_key') THEN
    ALTER TABLE public.profiles ADD COLUMN iyzico_sub_merchant_key TEXT;
  END IF;
END $$;

-- 4. GÜVENLİK (RLS)
ALTER TABLE public.paywalls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paywall_purchases ENABLE ROW LEVEL SECURITY;

-- 5. POLİTİKALAR

-- A. Eğitmen kendi kursuna fiyat koyabilir
-- (İlişki: Kurs -> Kanal -> Topluluk -> Sahip)
DROP POLICY IF EXISTS "Instructors can manage paywalls" ON public.paywalls;
CREATE POLICY "Instructors can manage paywalls"
  ON public.paywalls
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      JOIN public.channels ch ON c.channel_id = ch.id
      JOIN public.communities com ON ch.community_id = com.id
      WHERE c.id = paywalls.course_id
      AND com.owner_id = auth.uid()
    )
  );

-- B. Herkes fiyatı görebilir (Satın almak için)
DROP POLICY IF EXISTS "Everyone can view paywalls" ON public.paywalls;
CREATE POLICY "Everyone can view paywalls"
  ON public.paywalls
  FOR SELECT
  USING (true);

-- C. Kullanıcı kendi satın alımlarını görür
DROP POLICY IF EXISTS "Users can view their own purchases" ON public.paywall_purchases;
CREATE POLICY "Users can view their own purchases"
  ON public.paywall_purchases
  FOR SELECT
  USING (auth.uid() = user_id);

-- D. Eğitmen kendi kursunun satışlarını görür
DROP POLICY IF EXISTS "Instructors can view purchases" ON public.paywall_purchases;
CREATE POLICY "Instructors can view purchases"
  ON public.paywall_purchases
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.paywalls pw
      JOIN public.courses c ON c.id = pw.course_id
      JOIN public.channels ch ON c.channel_id = ch.id
      JOIN public.communities com ON ch.community_id = com.id
      WHERE pw.id = paywall_purchases.paywall_id
      AND com.owner_id = auth.uid()
    )
  );
