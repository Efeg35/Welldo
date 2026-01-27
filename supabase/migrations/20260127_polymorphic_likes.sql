-- =======================================================
-- LIKES: THE "UNIVERSAL FIXER" SCRIPT 🛠️
-- =======================================================

-- 1. ADIM: İSİM DÜZELTME (RENAME)
-- Eğer tablo hala "post_likes" ismindeyse, adını "likes" yap.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'post_likes') THEN
    ALTER TABLE public.post_likes RENAME TO likes;
  END IF;
END $$;

-- 2. ADIM: YOKSA OLUŞTUR (FRESH START)
-- Eğer tablo hiç yoksa (belki silindi), sıfırdan en doğru haliyle oluştur.
CREATE TABLE IF NOT EXISTS public.likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Constraint: Ya Post Ya Event
    CONSTRAINT likes_target_check CHECK (
        (post_id IS NOT NULL AND event_id IS NULL) OR 
        (post_id IS NULL AND event_id IS NOT NULL)
    )
);

-- 3. ADIM: VARSA TAMİR ET (MIGRATION)
-- Tablo zaten varsa ama eski yapıdaysa (PK sorunu vb.), burası devreye girer.

-- A. Eski Primary Key Zincirlerini Kır 🔓
ALTER TABLE public.likes DROP CONSTRAINT IF EXISTS post_likes_pkey;
ALTER TABLE public.likes DROP CONSTRAINT IF EXISTS likes_pkey;

-- B. Sütunları Ayarla
-- ID sütunu yoksa ekle (UUID)
ALTER TABLE public.likes ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();

-- ID'yi Primary Key Yap (Eğer zaten PK değilse)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'likes_pkey') THEN
    ALTER TABLE public.likes ADD PRIMARY KEY (id);
  END IF;
END $$;

-- Event ID Ekle
ALTER TABLE public.likes ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE CASCADE;

-- Post ID'yi Özgür Bırak (Nullable)
ALTER TABLE public.likes ALTER COLUMN post_id DROP NOT NULL;

-- C. Check Constraint (Eskisini sil, yenisini ekle)
ALTER TABLE public.likes DROP CONSTRAINT IF EXISTS likes_target_check;
ALTER TABLE public.likes ADD CONSTRAINT likes_target_check 
CHECK (
  (post_id IS NOT NULL AND event_id IS NULL) OR 
  (post_id IS NULL AND event_id IS NOT NULL)
);

-- 4. ADIM: TEKİLLİK VE PERFORMANS (INDEXES)
-- "Duplicate Key" hatası almamak için önce eski unique indexleri temizle
DROP INDEX IF EXISTS idx_likes_unique_post;
DROP INDEX IF EXISTS idx_likes_unique_event;
-- (Eğer tablo daha önce 'post_likes' ise eski index adı farklı olabilir, sorun değil)

-- Yeni Partial Indexleri Oluştur (Bir kullanıcı bir şeyi 1 kere beğensin)
CREATE UNIQUE INDEX IF NOT EXISTS idx_likes_unique_post 
ON public.likes(user_id, post_id) WHERE post_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_likes_unique_event 
ON public.likes(user_id, event_id) WHERE event_id IS NOT NULL;

-- Performans Indexleri
CREATE INDEX IF NOT EXISTS idx_likes_event_id ON public.likes(event_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes(post_id);

-- 5. ADIM: GÜVENLİK (RLS)
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- Politikaları Temizle ve Yeniden Yaz
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON public.likes;
DROP POLICY IF EXISTS "Authenticated users can create likes" ON public.likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON public.likes;

-- A. Görüntüleme
CREATE POLICY "Likes are viewable by everyone" ON public.likes FOR SELECT USING (true);

-- B. Ekleme
CREATE POLICY "Authenticated users can create likes" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- C. Silme
CREATE POLICY "Users can delete their own likes" ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- 6. ADIM: REALTIME
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'likes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.likes;
  END IF;
END $$;
