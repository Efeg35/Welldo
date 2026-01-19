import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { getPosts } from "@/actions/community";
import { CreatePost } from "@/components/community/create-post";
import { PostCard } from "@/components/community/post-card";
import { notFound } from "next/navigation";

interface SpacePageProps {
    params: {
        slug: string;
    };
}

export default async function SpacePage({ params }: SpacePageProps) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch channel details
    const { data: channel } = await supabase
        .from('channels')
        .select('*')
        .eq('slug', params.slug)
        .single();

    if (!channel) {
        notFound();
    }

    // Fetch posts for this channel
    const posts = await getPosts(channel.id);

    return (
        <div className="max-w-3xl mx-auto p-6 space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between border-b border-border pb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#408FED] to-[#3E1BC9] flex items-center justify-center text-white text-xl">
                        {/* Icon handling could be improved */}
                        ✦
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">{channel.name}</h1>
                        <p className="text-muted-foreground">{channel.description}</p>
                    </div>
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
                    <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            {/* Create Post Input (Only show if not read-only, user has permission) */}
            <CreatePost user={user} channelId={channel.id} communityId={channel.community_id} />

            {/* Post Feed */}
            <div className="space-y-4">
                {posts.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground bg-card rounded-xl border border-border p-8">
                        <h3 className="font-semibold text-lg mb-2">Henüz içerik yok</h3>
                        <p>Bu alanda henüz bir paylaşım yapılmamış.</p>
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
