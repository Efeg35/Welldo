"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface CreateCourseParams {
    name: string;
    courseType: 'self-paced' | 'structured' | 'scheduled';
    communityId: string;
}

export async function createCourse(params: CreateCourseParams) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    try {
        // Generate slug
        const slug = params.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '') + '-' + Math.random().toString(36).substring(2, 7);

        // Get max order index
        const { data: maxOrder } = await supabase
            .from('channels')
            .select('order_index')
            .eq('community_id', params.communityId)
            .order('order_index', { ascending: false })
            .limit(1)
            .single();

        const newOrderIndex = (maxOrder?.order_index || 0) + 1;

        // Insert channel (Space)
        const { data: channel, error } = await supabase
            .from('channels')
            .insert({
                community_id: params.communityId,
                name: params.name,
                slug: slug,
                type: 'course', // Distinct type
                access_level: 'private', // Default to private/draft
                category: 'Courses',
                order_index: newOrderIndex,
                settings: {
                    course_type: params.courseType,
                    status: 'draft', // Draft by default
                    waitlist_enabled: false,
                }
            })
            .select()
            .single();

        if (error) {
            console.error("Course creation db error:", error);
            throw error;
        }

        revalidatePath('/community');
        return channel;

    } catch (error) {
        console.error("Failed to create course:", error);
        throw new Error("Failed to create course");
    }
}
