-- =======================================================
-- COMMENTS: POLYMORPHIC SUPPORT (EVENTS & POSTS)
-- =======================================================

-- 1. Sütunu Ekle (Event ID)
ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE CASCADE;

-- 2. Post ID Zorunluluğunu Kaldır (Çünkü artık Event de olabilir)
ALTER TABLE public.comments
ALTER COLUMN post_id DROP NOT NULL;

-- 3. Kısıtlamaları Güncelle (Constraint) 🛡️
-- Önce varsa eski kısıtlamayı temizle (Hata vermemesi için)
ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_target_check;

-- Şimdi sağlam kuralı ekle: Ya Post, Ya Event (İkisi birden olamaz, ikisi birden boş olamaz)
ALTER TABLE public.comments
ADD CONSTRAINT comments_target_check 
CHECK (
  (post_id IS NOT NULL AND event_id IS NULL) OR 
  (post_id IS NULL AND event_id IS NOT NULL)
);

-- 4. Performans Indexi (Etkinlik yorumlarını hızlı getirmek için)
CREATE INDEX IF NOT EXISTS idx_comments_event_id ON public.comments(event_id);

-- 5. RLS Politikalarını Güncelle

-- Mevcut politikaları kaldır
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;

-- A. OKUMA (Herkes görebilir)
CREATE POLICY "Comments are viewable by everyone" 
ON public.comments FOR SELECT USING (true);

-- B. OLUŞTURMA (Giriş yapmış kullanıcılar)
CREATE POLICY "Authenticated users can create comments" 
ON public.comments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- C. GÜNCELLEME (Sadece kendi yorumum)
CREATE POLICY "Users can update their own comments"
ON public.comments FOR UPDATE
USING (auth.uid() = user_id);

-- D. SİLME (Sadece kendi yorumum VEYA Adminler)
CREATE POLICY "Users and Admins can delete comments"
ON public.comments FOR DELETE
USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'instructor')
    )
);
