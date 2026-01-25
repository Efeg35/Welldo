"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getNotifications(filter: 'inbox' | 'all' | 'archived' = 'inbox') {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    let query = supabase
        .from('notifications')
        .select(`
            *,
            actor:profiles!notifications_actor_id_fkey (
                id,
                full_name,
                avatar_url
            )
        `)
        .eq('user_id', user.id);

    if (filter === 'inbox') {
        query = query.eq('is_read', false).eq('is_archived', false);
    } else if (filter === 'archived') {
        query = query.eq('is_archived', true);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching notifications:", error);
        return [];
    }

    return data;
}

export async function markNotificationAsRead(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

    if (error) throw new Error("Bildirim okundu işaretlenemedi");
    revalidatePath('/', 'layout');
}

export async function markAllAsRead() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

    if (error) throw new Error("Bildirimler okundu işaretlenemedi");
    revalidatePath('/', 'layout');
}

export async function archiveNotification(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('notifications')
        .update({ is_archived: true })
        .eq('id', id);

    if (error) throw new Error("Bildirim arşivlenemedi");
    revalidatePath('/', 'layout');
}

export async function getUnreadCount() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
        .eq('is_archived', false);

    if (error) return 0;
    return count || 0;
}
