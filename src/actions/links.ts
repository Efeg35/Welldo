"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createLink(communityId: string, label: string, url: string) {
    const supabase = await createClient();

    // Optionally Validate Role Here explicitly if RLS isn't enough trusted (RLS is safer source of truth)
    // But for UI feedback/fail-fast:
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase.from('community_links').insert({
        community_id: communityId,
        label,
        url,
        // icon: 'link' (default or optional)
    });

    if (error) {
        console.error("Link creation error:", error);
        throw new Error("Link oluşturulamadı");
    }

    revalidatePath(`/community/[slug]`, 'layout'); // Revalidate broadly to update sidebar
    revalidatePath('/', 'layout');
}

export async function deleteLink(linkId: string) {
    const supabase = await createClient();

    const { error } = await supabase.from('community_links').delete().eq('id', linkId);

    if (error) {
        console.error("Link deletion error:", error);
        throw new Error("Link silinemedi");
    }

    revalidatePath(`/community/[slug]`, 'layout');
    revalidatePath('/', 'layout');
}

export async function getLinks(communityId: string) {
    const supabase = await createClient();

    // RLS handles visibility
    const { data, error } = await supabase
        .from('community_links')
        .select('*')
        .eq('community_id', communityId)
        .order('created_at', { ascending: true });

    if (error) return [];
    return data;
}

export async function updateLink(linkId: string, label: string, url: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('community_links')
        .update({ label, url })
        .eq('id', linkId);

    if (error) {
        console.error("Link update error:", error);
        throw new Error("Link güncellenemedi");
    }

    revalidatePath(`/community/[slug]`, 'layout');
    revalidatePath('/', 'layout');
}
