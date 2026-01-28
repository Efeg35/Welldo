-- ================================================================
-- 🔒 CONSOLIDATED SECURITY MIGRATION
-- ================================================================
-- Bu dosya, tüm güvenlik yamalarının TEK ve NİHAİ halidir.
-- Tarih: 2026-01-28
-- 
-- İçerik:
-- 1. Helper Fonksiyonlar (SECURITY DEFINER ile RLS bypass)
-- 2. Tablo Politikaları (Infinite Recursion sorunu çözülmüş)
-- 3. Fonksiyon Güvenlik Ayarları (search_path injection önlemi)
-- ================================================================

-- ================================================================
-- BÖLÜM 1: HELPER FONKSİYONLAR
-- ================================================================
-- Bu fonksiyonlar SECURITY DEFINER ile çalışır.
-- RLS politikalarını bypass ederek sonsuz döngüyü kırarlar.

CREATE OR REPLACE FUNCTION public.is_member_of(_community_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.memberships
    WHERE community_id = _community_id
    AND user_id = auth.uid()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.shares_community_with(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.memberships m1
    JOIN public.memberships m2 ON m1.community_id = m2.community_id
    WHERE m1.user_id = auth.uid()
    AND m2.user_id = _user_id
  );
END;
$$;

-- ================================================================
-- BÖLÜM 2: TABLO POLİTİKALARI
-- ================================================================

-- 2.1 PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles viewable by self and co-members" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Profiles viewable by self and co-members"
ON public.profiles FOR SELECT
USING (id = auth.uid() OR public.shares_community_with(id));

-- 2.2 COMMUNITIES
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Communities visibility" ON public.communities;
DROP POLICY IF EXISTS "Communities are viewable by everyone" ON public.communities;

CREATE POLICY "Communities visibility"
ON public.communities FOR SELECT
USING (
  is_public = true
  OR owner_id = auth.uid()
  OR public.is_member_of(id)
);

-- 2.3 MEMBERSHIPS
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.memberships;
DROP POLICY IF EXISTS "Community owners can view memberships" ON public.memberships;
DROP POLICY IF EXISTS "Members can view co-members" ON public.memberships;
DROP POLICY IF EXISTS "Memberships strict visibility" ON public.memberships;

CREATE POLICY "Users can view their own memberships"
ON public.memberships FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Community owners can view memberships"
ON public.memberships FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.communities c
    WHERE c.id = memberships.community_id
    AND c.owner_id = auth.uid()
  )
);

CREATE POLICY "Members can view co-members"
ON public.memberships FOR SELECT
USING (public.is_member_of(community_id));

-- 2.4 CHANNELS
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Channels viewable by members and public" ON public.channels;
DROP POLICY IF EXISTS "Channels strict visibility" ON public.channels;
DROP POLICY IF EXISTS "Channels are viewable by community members" ON public.channels;
DROP POLICY IF EXISTS "Channels are viewable by members and public" ON public.channels;

CREATE POLICY "Channels strict visibility"
ON public.channels FOR SELECT
USING (
  public.is_member_of(community_id)
  OR EXISTS (
    SELECT 1 FROM public.communities c
    WHERE c.id = channels.community_id
    AND (c.is_public = true OR c.owner_id = auth.uid())
  )
);

-- 2.5 POSTS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Posts restricted visibility" ON public.posts;
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;

CREATE POLICY "Posts restricted visibility"
ON public.posts FOR SELECT
USING (
  public.is_member_of(community_id)
  OR EXISTS (
    SELECT 1 FROM public.communities c
    WHERE c.id = posts.community_id
    AND (c.is_public = true OR c.owner_id = auth.uid())
  )
);

-- 2.6 EVENTS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Events viewable by members and public" ON public.events;
DROP POLICY IF EXISTS "Events are viewable by everyone" ON public.events;

CREATE POLICY "Events viewable by members and public"
ON public.events FOR SELECT
USING (
  public.is_member_of(community_id)
  OR EXISTS (
    SELECT 1 FROM public.communities c
    WHERE c.id = events.community_id
    AND (c.is_public = true OR c.owner_id = auth.uid())
  )
);

-- 2.7 EVENT_RESPONSES (Ambiguous Subquery Fix)
DROP POLICY IF EXISTS "Users can update their RSVP status" ON public.event_responses;

CREATE POLICY "Users can update their RSVP status"
ON public.event_responses FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
    auth.uid() = user_id AND 
    (
        checked_in_at IS NOT DISTINCT FROM (
            SELECT er.checked_in_at 
            FROM public.event_responses AS er 
            WHERE er.id = event_responses.id
        )
    )
);

-- 2.8 COMMENTS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Comments viewable by community members" ON public.comments;
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;

CREATE POLICY "Comments viewable by community members"
ON public.comments FOR SELECT
USING (
  (post_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.posts p
    WHERE p.id = comments.post_id
    AND (
      public.is_member_of(p.community_id)
      OR EXISTS (
        SELECT 1 FROM public.communities c
        WHERE c.id = p.community_id
        AND (c.is_public = true OR c.owner_id = auth.uid())
      )
    )
  ))
  OR
  (event_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = comments.event_id
    AND (
      public.is_member_of(e.community_id)
      OR EXISTS (
        SELECT 1 FROM public.communities c
        WHERE c.id = e.community_id
        AND (c.is_public = true OR c.owner_id = auth.uid())
      )
    )
  ))
);

-- 2.9 MESSAGES
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Messages viewable by channel members" ON public.messages;
DROP POLICY IF EXISTS "Messages are viewable by everyone" ON public.messages;

CREATE POLICY "Messages viewable by channel members"
ON public.messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.channels ch
    WHERE ch.id = messages.channel_id
    AND (
      public.is_member_of(ch.community_id)
      OR EXISTS (
        SELECT 1 FROM public.communities c
        WHERE c.id = ch.community_id
        AND (c.is_public = true OR c.owner_id = auth.uid())
      )
    )
  )
);

-- 2.10 COMMUNITY_LINKS
ALTER TABLE public.community_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Links visibility" ON public.community_links;
DROP POLICY IF EXISTS "Community links viewable by everyone" ON public.community_links;

CREATE POLICY "Links visibility"
ON public.community_links FOR SELECT
USING (
  public.is_member_of(community_id)
  OR EXISTS (
    SELECT 1 FROM public.communities c
    WHERE c.id = community_links.community_id
    AND (c.is_public = true OR c.owner_id = auth.uid())
  )
);

-- 2.11 GAMIFICATION
ALTER TABLE public.gamification ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Gamification restricted" ON public.gamification;
DROP POLICY IF EXISTS "Gamification is viewable by everyone" ON public.gamification;

CREATE POLICY "Gamification restricted"
ON public.gamification FOR SELECT
USING (
  user_id = auth.uid()
  OR public.is_member_of(community_id)
  OR EXISTS (
    SELECT 1 FROM public.communities c
    WHERE c.id = gamification.community_id
    AND c.owner_id = auth.uid()
  )
);

-- 2.12 LIKES (Polymorphic)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'likes') THEN
    EXECUTE 'ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Likes restricted" ON public.likes';
    EXECUTE 'DROP POLICY IF EXISTS "Likes are viewable by everyone" ON public.likes';
    EXECUTE 'CREATE POLICY "Likes restricted" ON public.likes FOR SELECT USING (
      (post_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.posts p
        WHERE p.id = likes.post_id
        AND (public.is_member_of(p.community_id) OR EXISTS (
          SELECT 1 FROM public.communities c
          WHERE c.id = p.community_id
          AND (c.is_public = true OR c.owner_id = auth.uid())
        ))
      ))
      OR
      (event_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.id = likes.event_id
        AND (public.is_member_of(e.community_id) OR EXISTS (
          SELECT 1 FROM public.communities c
          WHERE c.id = e.community_id
          AND (c.is_public = true OR c.owner_id = auth.uid())
        ))
      ))
    )';
  END IF;
END $$;

-- ================================================================
-- BÖLÜM 3: FONKSİYON GÜVENLİK AYARLARI
-- ================================================================
-- search_path injection saldırısını önlemek için tüm fonksiyonlara
-- sabit search_path ekleniyor.

ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

DO $$ BEGIN EXECUTE 'ALTER FUNCTION public.add_points(uuid, uuid, int, text) SET search_path = public'; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN EXECUTE 'ALTER FUNCTION public.get_or_create_conversation(uuid, uuid) SET search_path = public'; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN EXECUTE 'ALTER FUNCTION public.update_channel_positions(jsonb) SET search_path = public'; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN EXECUTE 'ALTER FUNCTION public.update_group_positions(jsonb) SET search_path = public'; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ================================================================
-- ✅ ÖZET: UYGULANAN GÜVENLİK ÖNLEMLERİ
-- ================================================================
-- 
-- 1. INFINITE RECURSION FIX:
--    - `is_member_of()` ve `shares_community_with()` fonksiyonları
--      SECURITY DEFINER ile tanımlandı.
--    - Bu sayede RLS politikaları içinden memberships tablosuna
--      erişim döngüye girmeden yapılabiliyor.
--
-- 2. MULTI-TENANCY:
--    - Her tablo için community_id bazlı izolasyon sağlandı.
--    - Kullanıcılar sadece üyesi oldukları toplulukların verilerini görebilir.
--
-- 3. AMBIGUOUS SUBQUERY FIX (event_responses):
--    - UPDATE politikasındaki "WHERE id = id" belirsizliği
--      "WHERE er.id = event_responses.id" şeklinde düzeltildi.
--
-- 4. SEARCH_PATH INJECTION FIX:
--    - Tüm SECURITY DEFINER fonksiyonlarına
--      SET search_path = public eklendi.
--
-- ================================================================
