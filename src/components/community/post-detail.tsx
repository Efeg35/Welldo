"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ThumbsUp, MessageCircle, Share2, Send, Bookmark } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { useState, useTransition, useOptimistic } from "react";
import { createComment, toggleLike } from "@/actions/community";
import { cn } from "@/lib/utils";
import { Post, Profile } from "@/types";
import { toast } from "sonner";
import Markdown from 'react-markdown';

interface PostDetailProps {
    post: any;
    user: Profile;
}

export function PostDetail({ post: initialPost, user }: PostDetailProps) {
    const router = useRouter();
    const [comment, setComment] = useState("");
    const [isPending, startTransition] = useTransition();
    const [post, setPost] = useState(initialPost);

    const hasLiked = post.post_likes?.some((like: any) => like.user_id === user.id) || false;
    const initialLikeCount = post._count?.post_likes || 0;

    const [optimisticLike, addOptimisticLike] = useOptimistic(
        { hasLiked, likeCount: initialLikeCount },
        (state, newHasLiked: boolean) => ({
            hasLiked: newHasLiked,
            likeCount: state.likeCount + (newHasLiked ? 1 : -1),
        })
    );

    const handleLike = () => {
        startTransition(async () => {
            addOptimisticLike(!optimisticLike.hasLiked);
            await toggleLike(post.id);
        });
    };

    const handleComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!comment.trim()) return;

        startTransition(async () => {
            try {
                await createComment(post.id, comment);
                setComment("");
                toast.success("Yorum eklendi");
                // Refreshing page to show new comment is handled by revalidatePath in action
                // But for immediate visual feedback we might need to fetch or use optimistic
            } catch (error) {
                toast.error("Yorum eklenemedi");
            }
        });
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success("Bağlantı kopyalandı!");
    };

    return (
        <div className="flex flex-col h-full bg-[#FAFAFA]">
            {/* Header Toolbar */}
            <div className="sticky top-0 z-10 bg-white border-b border-border shadow-sm w-full">
                <div className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="rounded-full hover:bg-muted/50"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h1 className="text-xl font-bold truncate">Gönderi Detayı</h1>
                </div>
            </div>

            <div className="max-w-4xl mx-auto w-full px-6 py-8 space-y-6 overflow-y-auto flex-1">
                {/* Main Post Card */}
                <div className="bg-white border border-border rounded-xl p-8 shadow-sm">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <Avatar className="w-12 h-12">
                                <AvatarImage src={post.profiles?.avatar_url} />
                                <AvatarFallback>{post.profiles?.full_name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <h2 className="font-bold text-lg leading-none mb-1">{post.profiles?.full_name}</h2>
                                <p className="text-sm text-muted-foreground">
                                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: tr })} • {post.profiles?.role === 'instructor' ? 'Eğitmen' : 'Üye'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {post.title && <h3 className="text-2xl font-extrabold tracking-tight">{post.title}</h3>}
                        {post.title && <h3 className="text-2xl font-extrabold tracking-tight">{post.title}</h3>}
                        <div className="text-lg leading-relaxed text-foreground/90 prose prose-zinc dark:prose-invert max-w-none">
                            <Markdown>{post.content}</Markdown>
                        </div>
                        {post.image_url && (
                            <div className="rounded-xl overflow-hidden border border-border mt-6">
                                <img src={post.image_url} alt="Post Attachment" className="w-full h-auto object-contain max-h-[600px] bg-muted/20" />
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-6 pt-8 mt-8 border-t border-border">
                        <button
                            onClick={handleLike}
                            className={cn(
                                "flex items-center gap-2 transition-colors font-medium",
                                optimisticLike.hasLiked ? "text-[#408FED]" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <ThumbsUp className={cn("w-5 h-5", optimisticLike.hasLiked && "fill-current")} />
                            <span>{optimisticLike.likeCount} Beğeni</span>
                        </button>
                        <div className="flex items-center gap-2 text-muted-foreground font-medium">
                            <MessageCircle className="w-5 h-5" />
                            <span>{post.comments?.length || 0} Yorum</span>
                        </div>
                        <button className="text-muted-foreground hover:text-foreground transition-colors ml-auto">
                            <Bookmark className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleShare}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <Share2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Comments Section */}
                <div className="space-y-6">
                    <h3 className="text-lg font-bold px-2">Yorumlar</h3>

                    {/* Comment Form */}
                    <form onSubmit={handleComment} className="bg-white border border-border rounded-xl p-4 shadow-sm flex gap-4">
                        <Avatar className="w-10 h-10">
                            <AvatarImage src={user.avatar_url || ""} />
                            <AvatarFallback>{user.full_name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 relative">
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Düşüncelerini paylaş..."
                                className="w-full bg-muted/30 border-none rounded-lg p-3 pr-12 focus:ring-1 focus:ring-primary min-h-[80px] resize-none outline-none text-sm"
                            />
                            <Button
                                type="submit"
                                size="icon"
                                disabled={isPending || !comment.trim()}
                                className="absolute bottom-2 right-2 rounded-lg"
                            >
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                    </form>

                    {/* Comments List */}
                    <div className="space-y-4">
                        {(post.comments || []).map((c: any) => (
                            <div key={c.id} className="bg-white border border-border rounded-xl p-4 shadow-sm flex gap-4">
                                <Avatar className="w-8 h-8">
                                    <AvatarImage src={c.profiles?.avatar_url} />
                                    <AvatarFallback>{c.profiles?.full_name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-bold text-sm">{c.profiles?.full_name}</span>
                                        <span className="text-[10px] text-muted-foreground">
                                            {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: tr })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-foreground/80 leading-relaxed">
                                        {c.content}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {post.comments?.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground bg-white border border-dashed rounded-xl">
                                Henüz yorum yapılmamış. İlk yorumu sen yap!
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
