-- =======================================================
-- TOPLULUK LİNKLERİ (SIDEBAR LINKS)
-- =======================================================

-- 1. Tabloyu Oluştur
CREATE TABLE IF NOT EXISTS public.community_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    url TEXT NOT NULL,
    icon TEXT, -- Opsiyonel ikon ismi (örn: 'discord', 'github')
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Güvenliği Aç
ALTER TABLE public.community_links ENABLE ROW LEVEL SECURITY;

-- 3. POLİTİKALAR

-- A. Herkes Görebilir
CREATE POLICY "Everyone can view community links"
    ON public.community_links
    FOR SELECT
    TO public
    USING (true);

-- B. Sadece Topluluk Sahibi VEYA Eğitmenler/Yöneticiler Ekleyebilir
CREATE POLICY "Owners and Instructors can insert links"
    ON public.community_links
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.communities
            WHERE id = community_links.community_id
            AND owner_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('instructor', 'admin')
        )
    );

-- C. Sadece Topluluk Sahibi VEYA Eğitmenler/Yöneticiler Düzenleyebilir
CREATE POLICY "Owners and Instructors can update links"
    ON public.community_links
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.communities
            WHERE id = community_links.community_id
            AND owner_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('instructor', 'admin')
        )
    );

-- D. Sadece Topluluk Sahibi VEYA Eğitmenler/Yöneticiler Silebilir
CREATE POLICY "Owners and Instructors can delete links"
    ON public.community_links
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.communities
            WHERE id = community_links.community_id
            AND owner_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('instructor', 'admin')
        )
    );

-- 4. REALTIME (CANLI GÜNCELLEME)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'community_links'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.community_links;
  END IF;
END $$;
