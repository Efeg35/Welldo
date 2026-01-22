-- =======================================================
-- FINAL COURSE SYSTEM (FIXED & ENHANCED)
-- =======================================================

-- 1. KURSLAR TABLOSU (Circle Style)
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'published'
  slug TEXT NOT NULL, 
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. MODÜLLER TABLOSU
CREATE TABLE IF NOT EXISTS public.course_modules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. DERSLER TABLOSU
CREATE TABLE IF NOT EXISTS public.course_lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT, -- Rich text
  video_url TEXT,
  attachments JSONB DEFAULT '[]'::jsonb, -- PDF vb. eklemek için
  is_free BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'published',
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. İLERLEME TAKİBİ (Progress Bar İçin Şart) 🚀
CREATE TABLE IF NOT EXISTS public.user_course_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- 5. PERFORMANS VE GÜVENLİK (RLS)
CREATE INDEX IF NOT EXISTS idx_courses_channel ON public.courses(channel_id);
CREATE INDEX IF NOT EXISTS idx_progress_user ON public.user_course_progress(user_id, course_id);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_course_progress ENABLE ROW LEVEL SECURITY;

-- 6. BASİT İZİNLER (Herkes okusun, sonra kısıtlarız)
DROP POLICY IF EXISTS "Courses viewable by everyone" ON public.courses;
CREATE POLICY "Courses viewable by everyone" ON public.courses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Modules viewable by everyone" ON public.course_modules;
CREATE POLICY "Modules viewable by everyone" ON public.course_modules FOR SELECT USING (true);

DROP POLICY IF EXISTS "Lessons viewable by everyone" ON public.course_lessons;
CREATE POLICY "Lessons viewable by everyone" ON public.course_lessons FOR SELECT USING (true);

-- Eğitmenlerin kurs oluşturmasına/düzenlemesine izin ver
DROP POLICY IF EXISTS "Instructors can manage courses" ON public.courses;
CREATE POLICY "Instructors can manage courses" ON public.courses FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.channels 
    JOIN public.communities ON channels.community_id = communities.id
    WHERE channels.id = courses.channel_id 
    AND communities.owner_id = auth.uid()
  )
);
