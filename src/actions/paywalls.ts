'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Paywall } from '@/types/database';

type PaywallType = 'course' | 'channel';

export async function getPaywall(entityId: string, type: PaywallType = 'course') {
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

    const column = type === 'course' ? 'course_id' : 'channel_id';

    const { data, error } = await supabase
        .from('paywalls')
        .select('*')
        .eq(column, entityId)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
        console.error('Error fetching paywall:', error);
        return { error: 'Failed to fetch paywall' };
    }

    return { paywall: data as Paywall | null };
}

// Backwards compatibility wrapper
export async function getCoursePaywall(id: string) {
    return getPaywall(id, 'course');
}


export async function upsertPaywall(entityId: string, type: PaywallType, price: number, currency: string = 'TRY') {
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

    const column = type === 'course' ? 'course_id' : 'channel_id';

    // Check for existing paywall
    const { data: existing } = await supabase
        .from('paywalls')
        .select('id')
        .eq(column, entityId)
        .single();

    let error;
    if (existing) {
        const { error: updateError } = await supabase
            .from('paywalls')
            .update({ price, currency, updated_at: new Date().toISOString() })
            .eq('id', existing.id);
        error = updateError;
    } else {
        const payload: any = { price, currency };
        payload[column] = entityId;

        const { error: insertError } = await supabase
            .from('paywalls')
            .insert(payload);
        error = insertError;
    }

    if (error) {
        console.error('Error saving paywall:', error);
        return { error: 'Failed to save paywall settings.' };
    }

    return { success: true };
}

export async function deletePaywall(entityId: string, type: PaywallType = 'course') {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll() { return cookieStore.getAll(); } } }
    );

    const column = type === 'course' ? 'course_id' : 'channel_id';

    const { error } = await supabase
        .from('paywalls')
        .delete()
        .eq(column, entityId);

    if (error) {
        return { error: 'Failed to remove paywall' };
    }
    return { success: true };
}
