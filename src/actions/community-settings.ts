"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface WelcomeBannerSettings {
    title: string;
    description: string;
    image_url: string | null;
    show_button: boolean;
    button_text?: string;
}

export async function updateCommunityBanner(communityId: string, bannerSettings: WelcomeBannerSettings) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    // Verify ownership or admin status
    const { data: community } = await supabase
        .from("communities")
        .select("owner_id")
        .eq("id", communityId)
        .single();

    if (!community) throw new Error("Community not found");

    if (community.owner_id !== user.id) {
        // TODO: Check for admin role if needed
        throw new Error("Unauthorized to update settings");
    }

    // Update
    const { error } = await supabase
        .from("communities")
        .update({
            welcome_banner: bannerSettings
        })
        .eq("id", communityId);

    if (error) {
        console.error("Error updating banner:", error);
        throw new Error("Failed to update banner settings");
    }

    revalidatePath("/crm");
    revalidatePath("/feed");
    revalidatePath("/community");
}

export async function getCommunityBanner(communityId: string): Promise<WelcomeBannerSettings | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("communities")
        .select("welcome_banner")
        .eq("id", communityId)
        .single();

    if (error) {
        console.error("Error fetching banner:", error);
        return null;
    }

    return data.welcome_banner as WelcomeBannerSettings;
}

export async function getCoverPhoto(communityId: string): Promise<string | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("communities")
        .select("cover_photo_url")
        .eq("id", communityId)
        .single();

    if (error) {
        console.error("Error fetching cover photo:", error);
        return null;
    }

    return data.cover_photo_url as string | null;
}

export async function updateCoverPhoto(communityId: string, coverPhotoUrl: string | null) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    // Verify ownership
    const { data: community } = await supabase
        .from("communities")
        .select("owner_id")
        .eq("id", communityId)
        .single();

    if (!community) throw new Error("Community not found");

    if (community.owner_id !== user.id) {
        throw new Error("Unauthorized to update settings");
    }

    const { error } = await supabase
        .from("communities")
        .update({ cover_photo_url: coverPhotoUrl })
        .eq("id", communityId);

    if (error) {
        console.error("Error updating cover photo:", error);
        throw new Error("Failed to update cover photo");
    }

    revalidatePath("/dashboard");
    revalidatePath("/feed");
}
