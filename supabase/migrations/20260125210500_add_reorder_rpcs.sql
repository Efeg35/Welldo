-- =======================================================
-- SÜRÜKLE-BIRAK İÇİN SİHİRLİ FONKSİYONLAR (RPC)
-- =======================================================

-- 1. KANAL GÜNCELLEME FONKSİYONUNU (RPC) DÜZELT
-- SECURITY DEFINER: Fonksiyonu yaratanın yetkisiyle (admin) çalıştırır.
CREATE OR REPLACE FUNCTION update_channel_positions(payload jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  item jsonb;
BEGIN
  -- Gelen JSON listesindeki her bir eleman için döngü
  FOR item IN SELECT * FROM jsonb_array_elements(payload)
  LOOP
    UPDATE public.channels
    SET 
      "position" = (item->>'position')::int, -- Tırnak işaretleri Postgres anahtar kelime çakışmasını önler
      group_id = (item->>'group_id')::uuid
    WHERE id = (item->>'id')::uuid;
  END LOOP;
END;
$$;

-- 2. GRUP GÜNCELLEME FONKSİYONUNU (RPC) DÜZELT
CREATE OR REPLACE FUNCTION update_group_positions(payload jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  item jsonb;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(payload)
  LOOP
    UPDATE public.channel_groups
    SET "position" = (item->>'position')::int
    WHERE id = (item->>'id')::uuid;
  END LOOP;
END;
$$;

-- 3. SCHEMA CACHE TEMİZLİĞİ
-- PostgREST'i tablo değişikliklerinden haberdar et
NOTIFY pgrst, 'reload config';
