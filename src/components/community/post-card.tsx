"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, ThumbsUp, MessageCircle, Bookmark, Share2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { toggleLike } from "@/actions/community";
import { useOptimistic, useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";

// Define interface locally for now, or import from types
interface Post {
    id: string;
    content: string;
    title?: string;
    image_url?: string;
    created_at: string;
    profiles: {
        id: string;
        full_name: string;
        avatar_url: string;
        role: string;
    };
    post_likes: { user_id: string }[];
    _count?: {
        post_likes: number;
    };
    comments?: { count: number }[]; // Adjusted to match supabase count return structure usually
}

interface PostCardProps {
    post: Post;
    currentUserId: string | undefined;
}

export function PostCard({ post, currentUserId }: PostCardProps) {
    const [isPending, startTransition] = useTransition();

    // Check if current user has liked
    const hasLiked = post.post_likes.some(like => like.user_id === currentUserId);
    const initialLikeCount = post._count?.post_likes || post.post_likes.length || 0; // Fallback logic

    // Optimistic UI for likes
    const [optimisticState, addOptimisticState] = useOptimistic(
        { hasLiked, likeCount: initialLikeCount },
        (state, newHasLiked: boolean) => ({
            hasLiked: newHasLiked,
            likeCount: state.likeCount + (newHasLiked ? 1 : -1),
        })
    );

    const handleLike = () => {
        startTransition(async () => {
            addOptimisticState(!optimisticState.hasLiked);
            await toggleLike(post.id);
        });
    };

    return (
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                        <AvatarImage src={post.profiles.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.profiles.id}`} />
                        <AvatarFallback>{post.profiles.full_name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-medium">{post.profiles.full_name}</span>
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

            <Link href={`/community/post/${post.id}`} className="block hover:bg-muted/30 transition-colors -mx-6 px-6 py-2 cursor-pointer">
                {post.title && <h3 className="font-bold text-lg mb-2">{post.title}</h3>}
                <p className="text-muted-foreground whitespace-pre-wrap line-clamp-4">
                    {post.content}
                </p>
                {post.image_url && (
                    <div className="mt-3 rounded-lg overflow-hidden border border-border">
                        <img src={post.image_url} alt="Post Attachment" className="w-full h-auto object-cover max-h-[500px]" />
                    </div>
                )}
            </Link>

            <div className="flex items-center gap-4 pt-2 border-t border-border">
                <button
                    onClick={handleLike}
                    disabled={isPending}
                    className={cn(
                        "flex items-center gap-2 transition-colors",
                        optimisticState.hasLiked ? "text-[#408FED]" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <ThumbsUp className={cn("w-4 h-4", optimisticState.hasLiked && "fill-current")} />
                    <span className="text-sm">{optimisticState.likeCount}</span>
                </button>
                <Link href={`/community/post/${post.id}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-sm">{post.comments?.length || post.comments?.[0]?.count || 0}</span>
                </Link>
                <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                    <Bookmark className="w-4 h-4" />
                </button>
                <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                    <Share2 className="w-4 h-4" />
                </button>
                {/* <span className="ml-auto text-sm text-muted-foreground">Deniz ve diğer 5 kişi beğendi</span> */}
            </div>
        </div>
    );
}
