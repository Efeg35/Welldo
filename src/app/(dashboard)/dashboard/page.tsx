import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    MoreHorizontal,
    MessageSquare
} from "lucide-react";
import { getPosts, getSidebarData } from "@/actions/community";
import { CreatePost } from "@/components/community/create-post";
import { PostCard } from "@/components/community/post-card";

import { FeedFilter } from "@/components/community/feed-filter";

export default async function DashboardPage({ searchParams }: { searchParams: { sort?: string } }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Capture sort param
    const sort = searchParams?.sort || 'latest';

    // Fetch posts with sort
    const posts = await getPosts(undefined, sort);

    // Fetch community context for Creating Post
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
        if (ownedCommunity) communityId = ownedCommunity.id;
    }

    // Fetch channels for CreatePost selector
    const { spaces } = await getSidebarData(communityId);
    // Filter out restricted channels if needed, but getSidebarData handles visibility
    const availableChannels = spaces;

    return (
        <div className="bg-[#FAFAFA] min-h-full"> {/* Distinct light gray background */}
            <div className="relative">

                {/* Header Toolbar - Full Width Background */}
                <div className="sticky top-0 z-10 bg-white border-b border-border shadow-sm w-full">
                    <div className="w-full px-8 py-3 flex items-center justify-between">
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Akış</h1>
                        <div className="flex items-center gap-3">
                            <FeedFilter />

                            <CreatePost user={user} communityId={communityId} channels={availableChannels}>
                                <Button size="sm" className="bg-[#1c1c1c] hover:bg-black text-white rounded-full px-5 font-medium shadow-sm transition-all hover:scale-105 active:scale-95 h-9">
                                    Yeni gönderi
                                </Button>
                            </CreatePost>

                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-muted/50 rounded-full h-9 w-9">
                                <MoreHorizontal className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Feed Content Area */}
                <div className="max-w-5xl mx-auto w-full min-h-full">
                    <div className="px-6 py-8">
                        {posts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
                                <div className="space-y-4 max-w-md">
                                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Topluluğuna Hoş Geldin</h2>
                                    <p className="text-muted-foreground text-lg">
                                        Burası ana akışın. Yeni gönderileri burada göreceksin.
                                    </p>
                                    <div className="pt-4">
                                        <CreatePost user={user} communityId={communityId} channels={availableChannels}>
                                            <Button size="lg" className="bg-[#1c1c1c] hover:bg-black text-white rounded-full px-8 font-medium shadow-md transition-all hover:shadow-lg">
                                                İlk gönderiyi oluştur
                                            </Button>
                                        </CreatePost>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 max-w-3xl mx-auto">
                                {posts.map((post: any) => (
                                    <PostCard
                                        key={post.id}
                                        post={post}
                                        currentUserId={user?.id}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Help Button */}
            <div className="fixed bottom-6 right-6">
                <Button className="rounded-full shadow-lg bg-white text-foreground border border-border hover:bg-muted h-10 px-4 gap-2 transition-transform hover:-translate-y-1">
                    <MessageSquare className="w-4 h-4 text-[#408FED]" />
                    <span className="text-sm font-medium">Yardım lazım mı?</span>
                </Button>
            </div>
        </div>
    );
}
