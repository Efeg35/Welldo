import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal } from "lucide-react";
import { getPosts } from "@/actions/community";
import { CreatePost } from "@/components/community/create-post";
import { PostCard } from "@/components/community/post-card";

export default async function CommunityPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch posts
    const posts = await getPosts();

    // Fetch communityId for creating posts (from membership or owned community)
    let communityId = "";
    if (user) {
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
    }

    return (
        <div className="max-w-3xl mx-auto p-6 space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#408FED]" />
                    <h1 className="text-xl font-semibold">Buradan Başla</h1>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map((i) => (
                            <Avatar key={i} className="w-8 h-8 border-2 border-background">
                                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}`} />
                                <AvatarFallback>K</AvatarFallback>
                            </Avatar>
                        ))}
                    </div>
                    <span className="text-sm text-muted-foreground">+233</span>
                    <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            {/* Hero Banner */}
            <div
                className="rounded-2xl p-8 text-white relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #408FED 0%, #3E1BC9 100%)' }}
            >
                <div className="absolute top-4 right-4 flex flex-col gap-3">
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 text-sm">
                        <Avatar className="w-6 h-6">
                            <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=share" />
                        </Avatar>
                        Başarılarını paylaş
                    </div>
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 text-sm">
                        <Avatar className="w-6 h-6">
                            <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=intro" />
                        </Avatar>
                        Kendini tanıt
                    </div>
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 text-sm">
                        <Avatar className="w-6 h-6">
                            <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=growth" />
                        </Avatar>
                        Büyüme stratejileri
                    </div>
                </div>

                <Badge className="bg-white/20 text-white border-none mb-4">Hemen Başla</Badge>
                <h2 className="text-3xl font-bold mb-2">WellDo Fitness</h2>
                <h2 className="text-3xl font-bold mb-2">Topluluğuna</h2>
                <h2 className="text-3xl font-bold">Hoş Geldin</h2>

                {/* Decorative star */}
                <div className="absolute right-1/3 top-1/2 transform -translate-y-1/2">
                    <div className="text-white/30 text-6xl">✦</div>
                </div>
            </div>

            {/* Create Post Input */}
            <CreatePost user={user} communityId={communityId} />

            {/* Post Feed */}
            <div className="space-y-4">
                {posts.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                        Henüz gönderi yok. İlk gönderiyi sen paylaş!
                    </div>
                ) : (
                    posts.map((post: any) => (
                        <PostCard
                            key={post.id}
                            post={post}
                            currentUserId={user?.id}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
