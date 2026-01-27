import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { getUnifiedFeed, getSidebarData, getUpcomingEventsForSidebar, getTrendingPosts } from "@/actions/community";
import { CreatePost } from "@/components/community/create-post";
import { PostCard } from "@/components/community/post-card";
import { FeedEventCard } from "@/components/community/feed-event-card";
import { QuickShareBox } from "@/components/community/quick-share-box";
import { FeedSidebar } from "@/components/community/feed-sidebar";
import { FeedFilter } from "@/components/community/feed-filter";

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
    const { data: membership } = await supabase
        .from("memberships")
        .select("community_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

    if (membership) {
        communityId = membership.community_id;
    } else {
        const { data: ownedCommunity } = await supabase
            .from('communities')
            .select('id')
            .eq('owner_id', user.id)
            .limit(1)
            .single();
        if (ownedCommunity) communityId = ownedCommunity.id;
    }

    // Fetch all data in parallel
    const [feedItems, { spaces }, upcomingEvents, trendingPosts] = await Promise.all([
        getUnifiedFeed(communityId, 30),
        getSidebarData(communityId),
        getUpcomingEventsForSidebar(communityId, 5),
        getTrendingPosts(communityId, 3)
    ]);

    const availableChannels = spaces;

    return (
        <div className="bg-[#FAFAFA] min-h-full">
            {/* Header Toolbar */}
            <div className="sticky top-0 z-10 bg-white border-b border-border shadow-sm w-full">
                <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Akış</h1>
                    <div className="flex items-center gap-3">
                        <FeedFilter />
                        <CreatePost user={user} communityId={communityId} channels={availableChannels}>
                            <Button size="sm" className="bg-gray-900 hover:bg-black text-white rounded-full px-5 font-medium shadow-sm transition-all h-9">
                                Yeni gönderi
                            </Button>
                        </CreatePost>
                    </div>
                </div>
            </div>

            {/* Two Column Layout */}
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
                <div className="flex gap-8">
                    {/* Left Column - Feed (70%) */}
                    <div className="flex-1 min-w-0">
                        {/* Quick Share Box */}
                        <div className="mb-6">
                            <QuickShareBox user={user} communityId={communityId} channels={availableChannels} />
                        </div>

                        {/* Feed Items */}
                        {feedItems.length === 0 ? (
                            <div className="bg-white rounded-xl border border-border shadow-sm p-12 text-center">
                                <div className="max-w-md mx-auto space-y-4">
                                    <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                                        <MessageSquare className="w-8 h-8 text-gray-500" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900">Topluluğuna Hoş Geldin</h2>
                                    <p className="text-muted-foreground">
                                        Burası ana akışın. Yeni gönderileri ve etkinlikleri burada göreceksin.
                                    </p>
                                    <CreatePost user={user} communityId={communityId} channels={availableChannels}>
                                        <Button size="lg" className="bg-gray-900 hover:bg-black text-white rounded-full px-8 font-medium shadow-md mt-4">
                                            İlk gönderiyi oluştur
                                        </Button>
                                    </CreatePost>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {feedItems.map((item: any) => {
                                    if (item.feedType === 'event') {
                                        return (
                                            <FeedEventCard
                                                key={`event-${item.id}`}
                                                event={item}
                                                currentUserId={user?.id}
                                            />
                                        );
                                    }
                                    return (
                                        <PostCard
                                            key={`post-${item.id}`}
                                            post={item}
                                            currentUserId={user?.id}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Right Column - Sidebar (30%) */}
                    <div className="hidden lg:block w-80 flex-shrink-0">
                        <div className="sticky top-[80px]">
                            <FeedSidebar
                                upcomingEvents={upcomingEvents}
                                trendingPosts={trendingPosts}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Help Button */}
            <div className="fixed bottom-6 right-6 z-50">
                <Button className="rounded-full shadow-lg bg-white text-foreground border border-border hover:bg-muted h-10 px-4 gap-2 transition-transform hover:-translate-y-1">
                    <MessageSquare className="w-4 h-4 text-gray-900" />
                    <span className="text-sm font-medium">Yardım lazım mı?</span>
                </Button>
            </div>
        </div>
    );
}
