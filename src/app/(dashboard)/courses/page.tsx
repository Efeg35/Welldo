import { createClient } from "@/lib/supabase/server";
import { CourseCatalog, EnrichedCourse } from "@/components/courses/course-catalog";
import { Channel, Course, Paywall } from "@/types";

export default async function CoursesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch user role
    let isInstructor = false;
    let mainCommunityId = "";
    let mainCommunitySlug = "";

    if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (profile?.role === 'instructor' || profile?.role === 'admin') {
            isInstructor = true;
        }

        // Get first community (assumption: working with one community context for now)
        const { data: community } = await supabase.from('communities').select('id, slug').limit(1).single();
        if (community) {
            mainCommunityId = community.id;
            mainCommunitySlug = community.slug;
        }
    }

    // 1. Fetch existing courses (channels with type='course')
    // and join with courses table for metadata + paywalls
    const { data: channels } = await supabase
        .from('channels')
        .select(`
            *,
            course:courses(
                *,
                paywalls(*)
            )
        `)
        .eq('type', 'course')
        .order('created_at', { ascending: false });

    // 2. Fetch user enrollments (if user exists)
    let ownedCourseIds = new Set<string>();
    if (user) {
        const { data: enrollments } = await supabase
            .from('user_course_enrollments')
            .select('course_id')
            .eq('user_id', user.id)
            .eq('status', 'active');

        enrollments?.forEach(e => ownedCourseIds.add(e.course_id));

        // Also fetch paywall purchases directly as fallback (optional but good for robustness)
        const { data: purchases } = await supabase
            .from('paywall_purchases')
            .select('paywall_id, paywalls(course_id)')
            .eq('user_id', user.id);

        purchases?.forEach((p: any) => {
            if (p.paywalls?.course_id) ownedCourseIds.add(p.paywalls.course_id);
        });
    }

    // 3. Transform and Sort Data
    const rawCourses = channels || [];

    const enrichedCourses: EnrichedCourse[] = rawCourses.map((channel: any) => {
        const courseData = channel.course?.[0] as (Course & { paywalls: Paywall[] });
        if (!courseData) return null; // Should not happen if data integrity is good

        // Determine ownership
        // Instructor always "owns" everything for viewing purposes?
        // Let's keep isOwned separate, but pass isInstructor to component for special overrides
        const isOwned = ownedCourseIds.has(courseData.id);

        return {
            ...courseData,
            channel: { ...channel, settings: channel.settings || {} }, // Ensure channel struct
            isOwned: isOwned,
            paywalls: courseData.paywalls
        };
    }).filter(Boolean) as EnrichedCourse[];

    // Sort: Owned first, then others
    enrichedCourses.sort((a, b) => {
        if (a.isOwned === b.isOwned) return 0;
        return a.isOwned ? -1 : 1;
    });

    return (
        <CourseCatalog
            courses={enrichedCourses}
            isInstructor={isInstructor}
            communityId={mainCommunityId}
            communitySlug={mainCommunitySlug}
        />
    );
}
