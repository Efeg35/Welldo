-- =======================================================
-- EVENT RESPONSES (RSVP) & SECURITY
-- =======================================================

-- 1. TABLOYU OLUŞTUR
CREATE TABLE IF NOT EXISTS event_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('attending', 'not_attending')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id) -- Çift oy kullanmayı engeller
);

-- 2. PERFORMANS INDEXLERİ
CREATE INDEX IF NOT EXISTS idx_event_responses_event_id ON event_responses(event_id);
CREATE INDEX IF NOT EXISTS idx_event_responses_user_id ON event_responses(user_id);

-- 3. UPDATED_AT TRIGGER'I
CREATE OR REPLACE FUNCTION update_event_responses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS event_responses_updated_at ON event_responses;
CREATE TRIGGER event_responses_updated_at
  BEFORE UPDATE ON event_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_event_responses_updated_at();

-- 4. 🚨 GÜVENLİK (RLS) AYARLARI 🚨
ALTER TABLE event_responses ENABLE ROW LEVEL SECURITY;

-- Temizlik (Eski politikalar varsa sil)
DROP POLICY IF EXISTS "Responses are viewable by everyone" ON event_responses;
DROP POLICY IF EXISTS "Users can manage their own responses" ON event_responses;

-- A. OKUMA: Herkes yanıtları görebilir (Katılımcı listesi için)
CREATE POLICY "Responses are viewable by everyone"
ON event_responses FOR SELECT
USING (true);

-- B. YÖNETME (Ekleme/Düzenleme/Silme): Sadece kendi yanıtım
CREATE POLICY "Users can manage their own responses"
ON event_responses FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
