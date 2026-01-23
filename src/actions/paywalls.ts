'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Paywall } from '@/types/database';

export async function getCoursePaywall(courseId: string) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
            },
        }
    );

    const { data, error } = await supabase
        .from('paywalls')
        .select('*')
        .eq('course_id', courseId)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
        console.error('Error fetching paywall:', error);
        return { error: 'Failed to fetch paywall' };
    }

    return { paywall: data as Paywall | null };
}

export async function upsertPaywall(courseId: string, price: number, currency: string = 'TRY') {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    // Check for existing paywall
    const { data: existing } = await supabase
        .from('paywalls')
        .select('id')
        .eq('course_id', courseId)
        .single();

    let error;
    if (existing) {
        const { error: updateError } = await supabase
            .from('paywalls')
            .update({ price, currency, updated_at: new Date().toISOString() })
            .eq('id', existing.id);
        error = updateError;
    } else {
        const { error: insertError } = await supabase
            .from('paywalls')
            .insert({ course_id: courseId, price, currency });
        error = insertError;
    }

    if (error) {
        console.error('Error saving paywall:', error);
        return { error: 'Failed to save paywall settings.' };
    }

    return { success: true };
}

export async function deletePaywall(courseId: string) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll() { return cookieStore.getAll(); } } }
    );

    const { error } = await supabase
        .from('paywalls')
        .delete()
        .eq('course_id', courseId);

    if (error) {
        return { error: 'Failed to remove paywall' };
    }
    return { success: true };
}
