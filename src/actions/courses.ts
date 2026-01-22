"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createCourse(
    communityId: string,
    name: string,
    description: string | null,
    isPrivate: boolean,
    courseType?: string,
    category: string = "Spaces"
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    // 1. Create a Channel for the course
    // Need to handle slug generation. Basic slugify.
    const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    const uniqueSlug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;

    const { data: channel, error: channelError } = await supabase
        .from('channels')
        .insert({
            community_id: communityId,
            name: name,
            slug: uniqueSlug,
            type: 'course',
            description: description,
            category: category,
            icon: 'book-open',
            is_default: false,
            settings: { course_type: courseType || 'self-paced' }
        })
        .select()
        .single();

    if (channelError) {
        console.error("Error creating course channel:", channelError);
        throw new Error("Failed to create course channel");
    }

    // 2. Create the Course entry
    const { data: course, error: courseError } = await supabase
        .from('courses')
        .insert({
            channel_id: channel.id,
            title: name,
            slug: uniqueSlug,
            description: description,
            status: 'draft'
        })
        .select()
        .single();

    if (courseError) {
        console.error("Error creating course entry:", courseError);
        // Delete the channel if course creation fails to avoid orphan channels
        await supabase.from('channels').delete().eq('id', channel.id);
        throw new Error(`Failed to create course details: ${courseError.message} (${courseError.code})`);
    }

    revalidatePath('/', 'layout');
    return { channel, course };
}

export async function getCourse(channelId: string) {
    const supabase = await createClient();

    const { data: course, error } = await supabase
        .from('courses')
        .select(`
            *,
            modules:course_modules(
                *,
                lessons:course_lessons(*)
            )
        `)
        .eq('channel_id', channelId)
        .single();

    // Sort modules and lessons by order
    if (course && course.modules) {
        course.modules.sort((a: any, b: any) => a.order - b.order);
        course.modules.forEach((module: any) => {
            if (module.lessons) {
                module.lessons.sort((a: any, b: any) => a.order - b.order);
            }
        });
    }

    if (error) {
        console.error("Error fetching course:", error);
        return null;
    }

    return course;
}

// --- Module & Lesson Management ---

export async function createModule(courseId: string, title: string) {
    const supabase = await createClient();

    // Get max order
    const { data: maxOrderData } = await supabase
        .from('course_modules')
        .select('order')
        .eq('course_id', courseId)
        .order('order', { ascending: false })
        .limit(1)
        .single();

    const newOrder = (maxOrderData?.order ?? 0) + 1;

    const { data, error } = await supabase
        .from('course_modules')
        .insert({
            course_id: courseId,
            title: title,
            order: newOrder
        })
        .select()
        .single();

    if (error) throw new Error(error.message);
    revalidatePath('/community');
    return data;
}

export async function createLesson(moduleId: string, title: string) {
    const supabase = await createClient();

    // Get max order
    const { data: maxOrderData } = await supabase
        .from('course_lessons')
        .select('order')
        .eq('module_id', moduleId)
        .order('order', { ascending: false })
        .limit(1)
        .single();

    const newOrder = (maxOrderData?.order ?? 0) + 1;

    const { data, error } = await supabase
        .from('course_lessons')
        .insert({
            module_id: moduleId,
            title: title,
            order: newOrder,
            status: 'draft'
        })
        .select()
        .single();

    if (error) throw new Error(error.message);
    revalidatePath('/community');
    return data;
}

export async function updateLesson(lessonId: string, updates: any) { // Type 'any' for speed, can be strict CourseLessonUpdate
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('course_lessons')
        .update(updates)
        .eq('id', lessonId)
        .select()
        .single();

    if (error) throw new Error(error.message);
    revalidatePath('/community');
    return data;
}

export async function deleteModule(moduleId: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('course_modules').delete().eq('id', moduleId);
    if (error) throw new Error(error.message);
    revalidatePath('/community');
}

export async function deleteLesson(lessonId: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('course_lessons').delete().eq('id', lessonId);
    if (error) throw new Error(error.message);
    revalidatePath('/community');
}
