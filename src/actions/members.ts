"use server";

import { createClient } from "@/lib/supabase/server";
import { UserRole } from "@/types/database";

export interface Member {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    email: string | null;
    role: UserRole;
    joined_at: string;
    location?: string;
    bio?: string;
    activity_score?: number;
    is_online?: boolean;
    last_seen_at?: string;
}

export interface MemberFilters {
    search?: string;
    role?: UserRole | 'all';
    name?: string;
    tag?: string;
    location?: string;
    activityScore?: 'high' | 'medium' | 'low' | 'all';
    status?: 'active' | 'all';
    onlineStatus?: 'online' | 'offline' | 'all';
    spaceAccess?: string;
    upcomingEventId?: string;
}

export async function getMembers(
    communityId: string,
    filters: MemberFilters = {},
    page = 1,
    limit = 50
) {
    const supabase = await createClient();

    // Build the base query
    let query = supabase
        .from("memberships")
        .select(`
            user_id,
            status,
            created_at,
            profiles!inner (
                id,
                full_name,
                avatar_url,
                role,
                email,
                bio,
                last_seen_at
            )
        `, { count: 'exact' })
        .eq("community_id", communityId);

    // Filter by Space Access (if provided)
    if (filters.spaceAccess) {
        // Get users who are members of this channel
        const { data: channelMembers } = await supabase
            .from("channel_members")
            .select("user_id")
            .eq("channel_id", filters.spaceAccess);

        const authorizedUserIds = (channelMembers || []).map(cm => cm.user_id);

        if (authorizedUserIds.length > 0) {
            query = query.in("user_id", authorizedUserIds);
        } else {
            // No members in this channel, return empty result
            return { members: [], total: 0 };
        }
    }

    // Filter by Upcoming Event (RSVP/Ticket)
    if (filters.upcomingEventId) {
        // Get users who have tickets OR have RSVP'd 'attending'
        const { data: ticketHolders } = await supabase
            .from("tickets")
            .select("user_id")
            .eq("event_id", filters.upcomingEventId);

        const { data: rsvpAttendees } = await supabase
            .from("event_responses")
            .select("user_id")
            .eq("event_id", filters.upcomingEventId)
            .eq("status", "attending");

        const ticketUserIds = (ticketHolders || []).map(t => t.user_id);
        const rsvpUserIds = (rsvpAttendees || []).map(r => r.user_id);

        // Combine unique user IDs
        const eventUserIds = [...new Set([...ticketUserIds, ...rsvpUserIds])];

        if (eventUserIds.length > 0) {
            query = query.in("user_id", eventUserIds);
        } else {
            return { members: [], total: 0 };
        }
    }

    // Always filter active by default
    if (!filters.status || filters.status === 'active') {
        query = query.eq("status", "active");
    }

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

    // Get gamification data for activity scores
    const userIds = (data || []).map((item: any) => item.profiles?.id || item.user_id);

    let gamificationMap: Record<string, number> = {};
    if (userIds.length > 0) {
        const { data: gamificationData } = await supabase
            .from("gamification")
            .select("user_id, points")
            .eq("community_id", communityId)
            .in("user_id", userIds);

        if (gamificationData) {
            gamificationData.forEach((g: any) => {
                gamificationMap[g.user_id] = g.points || 0;
            });
        }
    }

    // Transform Data
    let members: Member[] = (data || []).map((item: any) => {
        const lastSeen = item.profiles?.last_seen_at;
        const isOnline = lastSeen ? (new Date().getTime() - new Date(lastSeen).getTime() < 5 * 60 * 1000) : false;

        return {
            id: item.profiles?.id || item.user_id,
            full_name: item.profiles?.full_name || "Unknown User",
            avatar_url: item.profiles?.avatar_url,
            email: item.profiles?.email,
            role: item.profiles?.role || "member",
            joined_at: item.created_at,
            bio: item.profiles?.bio,
            activity_score: gamificationMap[item.profiles?.id || item.user_id] || 0,
            last_seen_at: lastSeen,
            is_online: isOnline
        };
    });

    // Apply In-Memory Filters
    // Search filter (name or email)
    if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        members = members.filter(m =>
            m.full_name?.toLowerCase().includes(searchLower) ||
            m.email?.toLowerCase().includes(searchLower)
        );
    }

    // Name filter
    if (filters.name) {
        const nameLower = filters.name.toLowerCase();
        members = members.filter(m =>
            m.full_name?.toLowerCase().includes(nameLower)
        );
    }

    // Role filter
    if (filters.role && filters.role !== 'all') {
        members = members.filter(m => m.role === filters.role);
    }

    // Location filter
    if (filters.location) {
        const locationLower = filters.location.toLowerCase();
        members = members.filter(m =>
            m.location?.toLowerCase().includes(locationLower)
        );
    }

    // Activity score filter
    if (filters.activityScore && filters.activityScore !== 'all') {
        members = members.filter(m => {
            const score = m.activity_score || 0;
            switch (filters.activityScore) {
                case 'high': return score >= 80;
                case 'medium': return score >= 40 && score < 80;
                case 'low': return score < 40;
                default: return true;
            }
        });
    }

    // Online Status filter
    if (filters.onlineStatus && filters.onlineStatus !== 'all') {
        members = members.filter(m => {
            if (filters.onlineStatus === 'online') return m.is_online;
            if (filters.onlineStatus === 'offline') return !m.is_online;
            return true;
        });
    }

    return {
        members,
        total: count || members.length
    };
}

// Get available tags for filtering
export async function getMemberTags(communityId: string) {
    // For now, return empty array. Can be extended when tags system is implemented
    return [];
}

// Get spaces for access filtering
export async function getSpacesForFilter(communityId: string) {
    const supabase = await createClient();

    // Fetch channels (spaces)
    const { data } = await supabase
        .from("channels")
        .select("id, name, type")
        .eq("community_id", communityId)
        .order("position", { ascending: true });

    return (data || []).map(channel => ({
        id: channel.id,
        name: channel.name,
        type: channel.type
    }));
}

// Get upcoming events for filtering
export async function getUpcomingEvents(communityId: string) {
    const supabase = await createClient();

    const { data } = await supabase
        .from("events")
        .select("id, title, start_time")
        .eq("community_id", communityId)
        .gt("start_time", new Date().toISOString())
        .order("start_time", { ascending: true })
        .limit(10); // Limit to next 10 events for UI sanity

    return (data || []).map(event => ({
        id: event.id,
        title: event.title,
        start_time: event.start_time
    }));
}
