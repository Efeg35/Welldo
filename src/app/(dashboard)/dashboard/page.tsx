import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUnifiedFeed, getSidebarData, getUpcomingEventsForSidebar, getTrendingPosts } from "@/actions/community";
import { getCommunityBanner } from "@/actions/community-settings";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage({ searchParams }: { searchParams: { sort?: string } }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Capture sort param
    const sort = searchParams?.sort || 'latest';

    // Fetch community context
    let communityId = "";
    let communityName = "WellDo";
    const { data: membership } = await supabase
        .from("memberships")
        .select("community_id, communities(name)")
        .eq("user_id", user.id)
        .limit(1)
        .single();

    if (membership) {
        communityId = membership.community_id;
        communityName = (membership.communities as any)?.name || "WellDo";
    } else {
        const { data: ownedCommunity } = await supabase
            .from('communities')
            .select('id, name')
            .eq('owner_id', user.id)
            .limit(1)
            .single();
        if (ownedCommunity) {
            communityId = ownedCommunity.id;
            communityName = ownedCommunity.name;
        }
    }

    // Fetch all data in parallel
    const [feedItems, { spaces }, upcomingEvents, trendingPosts, bannerSettings] = await Promise.all([
        getUnifiedFeed(communityId, 30),
        getSidebarData(communityId),
        getUpcomingEventsForSidebar(communityId, 5),
        getTrendingPosts(communityId, 3),
        getCommunityBanner(communityId)
    ]);

    const availableChannels = spaces;

    return (
        <DashboardClient
            user={user}
            communityId={communityId}
            communityName={communityName}
            feedItems={feedItems}
            availableChannels={availableChannels}
            upcomingEvents={upcomingEvents}
            trendingPosts={trendingPosts}
            bannerSettings={bannerSettings}
        />
    );
}
