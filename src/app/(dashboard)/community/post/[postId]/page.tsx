import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, ThumbsUp, MessageCircle, Share2, ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { CreateComment } from "@/components/community/create-comment";
import { CommentList } from "@/components/community/comment-list";
import { getComments } from "@/actions/community";

interface PostPageProps {
    params: {
        postId: string;
    };
}

export default async function PostDetailPage({ params }: PostPageProps) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch post details with channel info
    const { data: postData } = await supabase
        .from('posts')
        .select(`
            *,
            profiles (
                id,
                full_name,
                avatar_url,
                role
            ),
            channels (
                id,
                name,
                slug
            ),
            post_likes (
                user_id
            )
        `)
        .eq('id', params.postId)
        .single();

    if (!postData) {
        notFound();
    }

    // Cast to any and polyfill _count
    const post = {
        ...postData,
        _count: {
            post_likes: (postData as any).post_likes?.length || 0
        }
    } as any;

    const hasLiked = post.post_likes.some((like: any) => like.user_id === user?.id);

    // Fetch comments
    const comments = await getComments(post.id);

    return (
        <div className="max-w-3xl mx-auto p-6 space-y-6">
            <Link href={post.channels ? `/community/${post.channels.slug}` : "/community"} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" />
                {post.channels ? `${post.channels.name} Kanalına Dön` : "Akışa Dön"}
            </Link>

            <div className="bg-card border border-border rounded-xl p-6 space-y-6">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                            <AvatarImage src={post.profiles.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.profiles.id}`} />
                            <AvatarFallback>{post.profiles.full_name?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-lg">{post.profiles.full_name}</span>
                                {post.channels && (
                                    <span className="text-muted-foreground">
                                        • <Link href={`/community/${post.channels.slug}`} className="hover:underline">{post.channels.name}</Link>
                                    </span>
                                )}
                            </div>
                            <span className="text-sm text-muted-foreground">
                                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: tr })} • {post.profiles.role === 'instructor' ? 'Eğitmen' : 'Üye'}
                            </span>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-5 h-5" />
                    </Button>
                </div>

                <div>
                    <h1 className="text-2xl font-bold mb-4">{post.title}</h1>
                    <div className="text-foreground whitespace-pre-wrap text-lg leading-relaxed">
                        {post.content}
                    </div>
                </div>

                <div className="flex items-center gap-6 pt-4 border-t border-border">
                    <Button variant="ghost" size="sm" className="gap-2">
                        <ThumbsUp className={`w-5 h-5 ${hasLiked ? "fill-current text-[#408FED]" : ""}`} />
                        <span>{post._count.post_likes} Beğeni</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2">
                        <MessageCircle className="w-5 h-5" />
                        <span>{comments?.length || 0} Yorum</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2 ml-auto">
                        <Share2 className="w-5 h-5" />
                        <span>Paylaş</span>
                    </Button>
                </div>
            </div>

            {/* Comments Section */}
            <div className="space-y-6">
                <h3 className="font-semibold text-lg">Yorumlar</h3>
                <CreateComment postId={post.id} user={user} />
                <CommentList comments={comments || []} />
            </div>
        </div>
    );
}
