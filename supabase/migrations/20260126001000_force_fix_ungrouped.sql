-- =======================================================
-- FORCE FIX: UNGROUPED -> ALANLAR
-- =======================================================

-- Transaction başlat (Hata olursa geri alır)
BEGIN;

-- 1. 'Alanlar' Grubu Olmayan Topluluklar İçin Grup Oluştur
INSERT INTO public.channel_groups (community_id, name, slug, position)
SELECT 
    c.id, 
    'Alanlar', 
    'alanlar-' || substr(md5(random()::text), 1, 6), 
    0
FROM public.communities c
WHERE NOT EXISTS (
    SELECT 1 FROM public.channel_groups cg 
    WHERE cg.community_id = c.id AND cg.name = 'Alanlar'
);

-- 2. Sahipsiz (group_id = NULL) Kanalları Bul ve 'Alanlar' Grubuna Taşı
UPDATE public.channels c
SET group_id = cg.id
FROM public.channel_groups cg
WHERE c.community_id = cg.community_id 
AND cg.name = 'Alanlar'
AND c.group_id IS NULL;

COMMIT;

-- Bilgi ver
DO $$
DECLARE
  orphan_count INT;
BEGIN
  SELECT COUNT(*) INTO orphan_count FROM public.channels WHERE group_id IS NULL;
  RAISE NOTICE 'Kalan sahipsiz kanal sayısı: %', orphan_count;
END $$;
