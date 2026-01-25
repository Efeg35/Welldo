-- =======================================================
-- CHANNELS YÖNETİM İZNİ GÜNCELLEMESİ
-- =======================================================

-- 1. Eski Politikayı İsmiyle Sil
DROP POLICY IF EXISTS "Community owners can manage channels" ON public.channels;

-- 2. Eğer daha önce denediysen "Staff" isimli olanı da sil
DROP POLICY IF EXISTS "Staff can manage channels" ON public.channels;

-- 3. Yeni "Süper Yönetim" Politikasını Oluştur
-- Bu politika hem Site Yöneticilerine hem de Topluluk Sahiplerine tam yetki verir.
CREATE POLICY "Staff and Owners can manage channels"
  ON public.channels
  FOR ALL -- Select, Insert, Update (Drag-Drop), Delete
  TO authenticated
  USING (
    -- DURUM A: Platform Yöneticisi/Eğitmeni ise
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('instructor', 'admin')
    )
    OR
    -- DURUM B: Topluluk Sahibi ise
    EXISTS (
      SELECT 1 FROM public.communities
      WHERE id = channels.community_id
      AND owner_id = auth.uid()
    )
  );
