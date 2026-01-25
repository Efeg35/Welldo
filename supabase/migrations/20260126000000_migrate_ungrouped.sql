-- =======================================================
-- MIGRATION: ORPHAN CHANNELS -> 'Alanlar' GRUBU
-- =======================================================

DO $$ 
DECLARE
  new_group_id UUID;
  community_rec RECORD;
BEGIN
  -- Her topluluk için döngüye gir
  FOR community_rec IN SELECT id FROM public.communities LOOP
    
    -- 1. ADIM: Önce bu toplulukta 'Alanlar' isminde grup var mı KONTROL ET
    -- Slug rastgele olduğu için 'name' üzerinden kontrol etmek daha güvenlidir.
    SELECT id INTO new_group_id 
    FROM public.channel_groups 
    WHERE community_id = community_rec.id 
    AND name = 'Alanlar'
    LIMIT 1;

    -- 2. ADIM: Eğer yoksa OLUŞTUR
    IF new_group_id IS NULL THEN
        INSERT INTO public.channel_groups (community_id, name, slug, position)
        VALUES (
            community_rec.id, 
            'Alanlar', 
            'alanlar-' || substr(md5(random()::text), 1, 6), -- Benzersiz slug üret
            0 -- En üstte görünsün
        )
        RETURNING id INTO new_group_id;
    END IF;

    -- 3. ADIM: Sahipsiz (Grubu olmayan) kanalları bu gruba taşı
    UPDATE public.channels
    SET group_id = new_group_id
    WHERE community_id = community_rec.id
    AND group_id IS NULL;
    
  END LOOP;
END $$;
