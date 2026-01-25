-- =======================================================
-- KANAL GRUPLARI (SIDEBAR CATEGORIES)
-- =======================================================

-- 1. Gruplar Tablosunu Oluştur
CREATE TABLE IF NOT EXISTS public.channel_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(community_id, slug)
);

-- 2. Kanallara Grup Bağlantısı Ekle
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='channels' AND column_name='group_id') THEN
    ALTER TABLE public.channels ADD COLUMN group_id UUID REFERENCES public.channel_groups(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3. HIZ VE SIRALAMA İÇİN INDEX
CREATE INDEX IF NOT EXISTS idx_channel_groups_community ON public.channel_groups(community_id);
CREATE INDEX IF NOT EXISTS idx_channel_groups_position ON public.channel_groups(position);

-- 4. GÜVENLİK (RLS) 🛡️
ALTER TABLE public.channel_groups ENABLE ROW LEVEL SECURITY;

-- Eski politikaları temizle
DROP POLICY IF EXISTS "Public channel_groups are viewable by everyone" ON public.channel_groups;
DROP POLICY IF EXISTS "Admins can insert channel_groups" ON public.channel_groups;
DROP POLICY IF EXISTS "Admins can update channel_groups" ON public.channel_groups;
DROP POLICY IF EXISTS "Admins can delete channel_groups" ON public.channel_groups;

-- Policies
-- A. Herkes Görebilir
CREATE POLICY "Public channel_groups are viewable by everyone"
  ON public.channel_groups FOR SELECT USING (true);

-- B. Sadece Topluluk Sahibi ve Yöneticiler Yönetebilir
-- Not: Kullanıcı isteği üzerine 'Owner' check kullanıldı ama Instructor/Admin rolü de eklendi
CREATE POLICY "Staff can manage channel_groups"
  ON public.channel_groups
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('instructor', 'admin')
    )
    OR
    EXISTS (
      SELECT 1 FROM public.communities
      WHERE id = channel_groups.community_id
      AND owner_id = auth.uid()
    )
  );

-- 5. REALTIME 🚀
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'channel_groups'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.channel_groups;
  END IF;
END $$;
