-- =======================================================
-- WELLDO COMMUNITY STRUCTURE UPDATE (SPACES & LINKS)
-- CTO VERSION 1.1 (Safe & Secured)
-- =======================================================

-- 1. EKSİK OLAN "POSTS" TABLOSUNU OLUŞTUR (Feed Yapısı İçin)
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
    channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE, -- Hangi alanda paylaşıldı?
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT,
    content TEXT NOT NULL,
    media_urls TEXT[], -- Resim/Video için array
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posts Güvenlik (RLS)
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Herkes gönderileri görebilir (veya sadece üyeler - şimdilik açık yapıyoruz)
DROP POLICY IF EXISTS "Posts viewable by members" ON public.posts;
CREATE POLICY "Posts viewable by members" 
ON public.posts FOR SELECT 
USING (
    EXISTS (SELECT 1 FROM public.memberships m WHERE m.community_id = posts.community_id AND m.user_id = auth.uid())
    OR 
    EXISTS (SELECT 1 FROM public.communities c WHERE c.id = posts.community_id AND c.owner_id = auth.uid())
);

-- Sadece üyeler gönderi atabilir
DROP POLICY IF EXISTS "Members can create posts" ON public.posts;
CREATE POLICY "Members can create posts" 
ON public.posts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 2. KANALLARI "SPACES" YAPISINA DÖNÜŞTÜRME
ALTER TABLE public.channels
ADD COLUMN IF NOT EXISTS slug TEXT,
ADD COLUMN IF NOT EXISTS icon TEXT,
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'post', -- 'post' (akış) veya 'chat' (sohbet)
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS category TEXT;

-- Aynı toplulukta aynı isimli slug olmasın (URL yapısı için)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_channel_slug_per_community') THEN
        ALTER TABLE public.channels ADD CONSTRAINT unique_channel_slug_per_community UNIQUE (community_id, slug);
    END IF;
END $$;

-- 3. LINKLER TABLOSU (Kenar Çubuğu İçin)
CREATE TABLE IF NOT EXISTS public.community_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
    label TEXT NOT NULL, -- Örn: "iOS İndir"
    url TEXT NOT NULL,
    icon TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.community_links ENABLE ROW LEVEL SECURITY;

-- Okuma: Herkes görebilir
DROP POLICY IF EXISTS "Community links viewable by everyone" ON public.community_links;
CREATE POLICY "Community links viewable by everyone" ON public.community_links FOR SELECT USING (true);

-- Yazma: SADECE SAHİP (Owner) link ekleyebilir/düzenleyebilir (GÜVENLİK DÜZELTMESİ)
DROP POLICY IF EXISTS "Only owners manage links" ON public.community_links;
CREATE POLICY "Only owners manage links" 
ON public.community_links FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.communities c 
        WHERE c.id = community_links.community_id AND c.owner_id = auth.uid()
    )
);

-- 4. ÖRNEK VERİLERİ YÜKLE (İlk topluluk varsa çalışır)
DO $$
DECLARE
    comm_id UUID;
BEGIN
    SELECT id INTO comm_id FROM public.communities LIMIT 1;
    
    IF comm_id IS NOT NULL THEN
        -- Alanları (Spaces) Ekle
        -- Not: Conflict durumunda hata vermesin diye DO NOTHING ekledik
        INSERT INTO public.channels (community_id, name, slug, description, type, icon, order_index, category) VALUES 
        (comm_id, 'Buradan Başla', 'start-here', 'Hoş geldiniz!', 'post', 'check-circle', 1, 'WellDo Kulübü'),
        (comm_id, 'Duyurular', 'announcements', 'Önemli haberler', 'post', 'megaphone', 2, 'WellDo Kulübü'),
        (comm_id, 'Tanışma', 'introductions', 'Kendini tanıt', 'chat', 'hand', 3, 'WellDo Kulübü'), -- Bunu 'chat' yaptık
        (comm_id, 'Başarılar', 'wins', 'Zaferlerini paylaş', 'post', 'trophy', 4, 'WellDo Kulübü')
        ON CONFLICT (community_id, slug) DO NOTHING;

        -- Linkleri Ekle
        INSERT INTO public.community_links (community_id, label, url, icon, order_index) VALUES 
        (comm_id, 'iOS Uygulamasını İndir', '#', 'smartphone', 1)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
