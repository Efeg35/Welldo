-- =======================================================
-- BİLDİRİM SİSTEMİ (NOTIFICATIONS)
-- =======================================================

-- 1. Tabloyu Oluştur
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- Alıcı
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Gönderen (Eylemi yapan)
    type TEXT NOT NULL, -- 'like', 'comment', 'mention', 'new_post'
    resource_id UUID NOT NULL, -- İlgili post/yorum ID'si
    resource_type TEXT NOT NULL, -- 'post', 'comment', 'message'
    is_read BOOLEAN DEFAULT false NOT NULL,
    is_archived BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. PERFORMANS İÇİN INDEXLER
CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
ON public.notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_unread 
ON public.notifications(user_id) WHERE is_read = false;

-- 3. GÜVENLİK (RLS)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Politikaları Temizle
DROP POLICY IF EXISTS "Users can only view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can only update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can only delete their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;

-- A. Görme İzni (Sadece Alıcı)
CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- B. Güncelleme İzni (Okundu işaretlemek için - Sadece Alıcı)
CREATE POLICY "Users can update their own notifications"
    ON public.notifications FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- C. Silme İzni (Sadece Alıcı)
CREATE POLICY "Users can delete their own notifications"
    ON public.notifications FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- D. OLUŞTURMA İZNİ
CREATE POLICY "Users can insert notifications"
    ON public.notifications FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = actor_id);

-- 4. REALTIME (CANLI BİLDİRİM)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;
