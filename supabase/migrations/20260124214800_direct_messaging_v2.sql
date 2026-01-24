-- =======================================================
-- 1-1 MESAJLAŞMA SİSTEMİ (DIRECT MESSAGING) - V2
-- =======================================================

-- 1. KONUŞMALAR TABLOSU (Conversations)
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now() -- Son mesaj atıldığında güncellenecek
);

-- 2. KATILIMCILAR TABLOSU (Participants)
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_read_at TIMESTAMPTZ DEFAULT now(), -- 🔴 KRİTİK: Okundu bilgisi için
  PRIMARY KEY (conversation_id, user_id)
);

-- 3. MESAJLAR TABLOSU (Direct Messages)
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT,
  attachments JSONB DEFAULT '[]'::jsonb, -- 🔴 EKLEME: Resim/Dosya desteği
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. PERFORMANS İÇİN INDEXLER
CREATE INDEX IF NOT EXISTS idx_participants_user ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.direct_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON public.conversations(updated_at DESC);

-- 5. GÜVENLİK (RLS POLICIES)
-- Önce eskileri temizleyelim (hata almamak için)
DROP POLICY IF EXISTS "Users can view conversations they are in" ON public.conversations;
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON public.direct_messages;

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- A. Konuşmaları Görme Yetkisi (Sadece katılımcılar)
CREATE POLICY "Users can view conversations they are in"
ON public.conversations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = conversations.id
    AND user_id = auth.uid()
  )
);

-- B. Katılımcıları Görme Yetkisi
CREATE POLICY "Users can view participants of their conversations"
ON public.conversation_participants FOR SELECT
USING (
  user_id = auth.uid() OR -- Kendisi
  EXISTS ( -- Veya ortak konuşmadaki diğer kişi
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversation_participants.conversation_id
    AND cp.user_id = auth.uid()
  )
);

-- C. Mesajları Görme Yetkisi
CREATE POLICY "Users can view messages in their conversations"
ON public.direct_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = direct_messages.conversation_id
    AND user_id = auth.uid()
  )
);

-- D. Mesaj Gönderme Yetkisi
CREATE POLICY "Users can send messages to their conversations"
ON public.direct_messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = direct_messages.conversation_id
    AND user_id = auth.uid()
  )
);

-- 6. RPC FONKSİYONU: GET OR CREATE CONVERSATION 🚀
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(target_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  conv_id UUID;
BEGIN
  -- 1. İki kullanıcının ortak olduğu bir konuşma var mı kontrol et
  SELECT c.id INTO conv_id
  FROM public.conversations c
  JOIN public.conversation_participants p1 ON c.id = p1.conversation_id
  JOIN public.conversation_participants p2 ON c.id = p2.conversation_id
  WHERE p1.user_id = auth.uid()
  AND p2.user_id = target_user_id
  LIMIT 1;

  -- 2. Varsa ID'yi döndür
  IF conv_id IS NOT NULL THEN
    RETURN conv_id;
  END IF;

  -- 3. Yoksa yeni konuşma oluştur
  INSERT INTO public.conversations (created_at, updated_at)
  VALUES (now(), now())
  RETURNING id INTO conv_id;

  -- 4. Katılımcıları ekle (Ben ve O)
  INSERT INTO public.conversation_participants (conversation_id, user_id)
  VALUES 
    (conv_id, auth.uid()),
    (conv_id, target_user_id);

  RETURN conv_id;
END;
$$;

-- Realtime'ı etkinleştir
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
