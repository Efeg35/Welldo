"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function reorderGroups(items: { id: string, position: number }[]) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    try {
        const { error } = await supabase.rpc('update_group_positions', { payload: items });

        if (error) {
            console.error("Supabase RPC Error (reorderGroups):", error);
            throw error;
        }

        revalidatePath('/', 'layout');
    } catch (error: any) {
        console.error("Error reordering groups:", error.message || error);
        throw new Error(error.message || "Failed to reorder groups");
    }
}

export async function reorderChannels(items: { id: string, groupId: string | undefined | null, position: number }[]) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    try {
        // Map keys to match RPC expectation (groupId -> group_id)
        const formattedPayload = items.map(item => ({
            id: item.id,
            position: item.position,
            group_id: item.groupId
        }));

        const { error } = await supabase.rpc('update_channel_positions', { payload: formattedPayload });

        if (error) {
            console.error("Supabase RPC Error (reorderChannels):", error);
            throw error;
        }

        revalidatePath('/', 'layout');
    } catch (error: any) {
        console.error("Error reordering channels:", error.message || error);
        throw new Error(error.message || "Failed to reorder channels");
    }
}
