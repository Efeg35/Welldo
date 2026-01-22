-- Add drip release support to courses

-- 1. Add drip_delay_days to course_modules
ALTER TABLE public.course_modules 
ADD COLUMN IF NOT EXISTS drip_delay_days INTEGER DEFAULT 0;

-- 2. Create user_course_enrollments table
CREATE TABLE IF NOT EXISTS public.user_course_enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, course_id)
);

-- 3. Enable RLS
ALTER TABLE public.user_course_enrollments ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
CREATE POLICY "Users can view their own enrollments"
ON public.user_course_enrollments FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Instructors can view all enrollments for their courses"
ON public.user_course_enrollments FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.courses c
        JOIN public.channels ch ON c.channel_id = ch.id
        JOIN public.communities com ON ch.community_id = com.id
        WHERE c.id = user_course_enrollments.course_id
        AND com.owner_id = auth.uid()
    )
);

CREATE POLICY "Users can enroll themselves"
ON public.user_course_enrollments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_user_course ON public.user_course_enrollments(user_id, course_id);
