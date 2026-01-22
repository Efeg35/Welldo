-- Create a bucket for course assets (thumbnails, cover images, etc.)
INSERT INTO storage.buckets (id, name, public)
VALUES ('course_assets', 'course_assets', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for course_assets
CREATE POLICY "Allow public access to course_assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'course_assets');

CREATE POLICY "Allow instructors to upload course assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'course_assets'
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'instructor'
    )
);

CREATE POLICY "Allow instructors to delete course assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'course_assets'
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'instructor'
    )
);
