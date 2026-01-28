"use server";

import { createClient } from "@/lib/supabase/server";
import { Profile, UserRole } from "@/types/database";

export interface Member {
    id: string; // user_id
    full_name: string | null;
    avatar_url: string | null;
    email: string | null; // Only visible to admins usually, but we'll include it for now
    role: UserRole;
    joined_at: string;
    location?: string; // Potential future field
    bio?: string;
    headline?: string; // Potential future field
}

interface GetMembersFilters {
    search?: string;
    role?: UserRole | 'all';
    status?: 'active' | 'all'; // membership status
}

export async function getMembers(
    communityId: string,
    filters: GetMembersFilters = {},
    page = 1,
    limit = 20
) {
    const supabase = await createClient();

    let query = supabase
        .from("memberships")
        .select(`
            user_id,
            status,
            created_at,
            profiles:user_id (
                id,
                full_name,
                avatar_url,
                role,
                email,
                bio
            )
        `)
        .eq("community_id", communityId);

    // Apply Filters
    if (filters.status && filters.status !== 'all') {
        query = query.eq("status", filters.status);
    } else {
        // Default to active members generally, but 'all' might include past_due
        // For now, let's just show active members by default if not specified
        if (!filters.status) {
            query = query.eq("status", "active");
        }
    }

    // Role filtering would technically require filtering on the joined profile table, 
    // but supabase JS client filtering on joined tables usually needs !inner join or similar syntax.
    // For simplicity with standard RLS/Query, we might fetch and filter in memory if volume is low, 
    // or use exact join syntax: .eq('profiles.role', role)

    // Search is handled similarly.

    // Calculate Pagination Range
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query
        .range(from, to)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching members:", error);
        return { members: [], total: 0 };
    }

    // Transform Data
    let members: Member[] = (data || []).map((item: any) => ({
        id: item.profiles?.id || item.user_id,
        full_name: item.profiles?.full_name || "Unknown User",
        avatar_url: item.profiles?.avatar_url,
        email: item.profiles?.email,
        role: item.profiles?.role || "member",
        joined_at: item.created_at,
        bio: item.profiles?.bio
    }));

    // Apply In-Memory Filters (if not applied in DB query due to joined table limitations in simple format)
    if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        members = members.filter(m =>
            m.full_name?.toLowerCase().includes(searchLower) ||
            m.email?.toLowerCase().includes(searchLower)
        );
    }

    if (filters.role && filters.role !== 'all') {
        members = members.filter(m => m.role === filters.role);
    }

    return {
        members,
        total: count || 0
    };
}
