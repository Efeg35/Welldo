"use server";

import { createClient } from "@/lib/supabase/server";

const POINTS_PER_LEVEL = 1000;

export async function addPoints(
    userId: string,
    communityId: string,
    points: number
) {
    const supabase = await createClient();

    // Use secure RPC function
    const { data, error } = await supabase.rpc("add_points", {
        p_user_id: userId,
        p_community_id: communityId,
        p_points: points,
    });

    if (error) {
        console.error("Error adding points:", error);
        return { success: false, error: error.message };
    }

    return {
        success: true,
        points: (data as any).points,
        level: (data as any).level
    };
}

export async function getLeaderboard(communityId: string, limit = 10) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("gamification")
        .select(`
      points,
      level,
      user_id,
      user:profiles(
        full_name,
        avatar_url
      )
    `)
        .eq("community_id", communityId)
        .order("points", { ascending: false })
        .limit(limit);

    if (error) {
        console.error("Error fetching leaderboard:", error);
        return [];
    }

    return data;
}

export async function getUserRank(userId: string, communityId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("gamification")
        .select("*")
        .eq("user_id", userId)
        .eq("community_id", communityId)
        .single();

    if (error) {
        return null;
    }

    return data;
}
