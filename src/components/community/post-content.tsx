"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThumbsUp, MessageCircle, Share2, Send, Bookmark, MoreHorizontal, Image as ImageIcon, Smile, Paperclip, Mic, Video, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { useState, useTransition, useOptimistic } from "react";
import { createComment, toggleLike } from "@/actions/community";
import { cn } from "@/lib/utils";
import { Post, Profile } from "@/types";
import { toast } from "sonner";
import Markdown from 'react-markdown';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PostContentProps {
    post: Post;
    user: Profile;
}

export function PostContent({ post: initialPost, user }: PostContentProps) {
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
            await toggleLike(post.id, 'post');
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
                // In a real app we'd update local state or revalidate
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
        <div className="space-y-6">
            {/* Main Post Card */}
            <div className="bg-white border-b border-border p-6 md:p-8">
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12">
                            <AvatarImage src={post.profiles?.avatar_url || ""} />
                            <AvatarFallback>{post.profiles?.full_name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="font-bold text-lg leading-none">{post.profiles?.full_name}</h2>
                                {post.profiles?.role === 'instructor' && (
                                    <span className="bg-gray-900 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">Admin</span>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: tr })}
                            </p>
                        </div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
                                <MoreHorizontal className="w-5 h-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleShare}>Paylaş</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="space-y-4">
                    {post.title && <h3 className="text-2xl font-bold tracking-tight">{post.title}</h3>}
                    <div className="text-lg leading-relaxed text-foreground/90 prose prose-zinc dark:prose-invert max-w-none">
                        <Markdown>{post.content}</Markdown>
                    </div>
                    {post.image_url && (
                        <div className="rounded-xl overflow-hidden border border-border mt-6">
                            <img src={post.image_url} alt="Post Attachment" className="w-full h-auto object-contain max-h-[600px] bg-muted/20" />
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-6 pt-8 mt-2">
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
                </div>
            </div>

            {/* Comments Section */}
            <div className="bg-gray-50/50 p-6 md:p-8 space-y-8">
                {/* Comments List */}
                <div className="space-y-6">
                    {(post.comments || []).map((c: any) => (
                        <div key={c.id} className="flex gap-4 group">
                            <Avatar className="w-10 h-10 shrink-0">
                                <AvatarImage src={c.profiles?.avatar_url} />
                                <AvatarFallback>{c.profiles?.full_name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-gray-900">{c.profiles?.full_name}</span>
                                    {c.profiles?.role === 'instructor' && (
                                        <span className="bg-gray-200 text-gray-700 text-[10px] px-1.5 py-0.5 rounded-sm font-bold">MOD</span>
                                    )}
                                    <span className="text-xs text-muted-foreground">
                                        {c.created_at && !isNaN(new Date(c.created_at).getTime())
                                            ? formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: tr })
                                            : 'yakın zamanda'
                                        }
                                    </span>
                                </div>
                                <div className="text-gray-800 leading-relaxed">
                                    {c.content}
                                </div>
                                <div className="flex items-center gap-4 pt-1">
                                    <button className="text-xs font-semibold text-gray-500 hover:text-gray-800">Like</button>
                                    <button className="text-xs font-semibold text-gray-500 hover:text-gray-800">Reply</button>
                                    <button className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto text-gray-400 hover:text-gray-600">
                                        <MoreHorizontal className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {post.comments?.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground bg-white border border-dashed rounded-xl">
                            Henüz yorum yapılmamış. İlk yorumu sen yap!
                        </div>
                    )}
                </div>

                {/* Comment Form - Enhanced Styles at the bottom */}
                <div className="flex gap-4 border-t border-gray-100 pt-8">
                    <Avatar className="w-10 h-10 shrink-0">
                        <AvatarImage src={user.avatar_url || ""} />
                        <AvatarFallback>{user.full_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <div className="bg-white border focus-within:ring-1 focus-within:ring-gray-300 border-gray-200 rounded-xl shadow-sm overflow-hidden transition-all">
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Düşüncelerini paylaş..."
                                className="w-full bg-transparent border-none p-4 min-h-[60px] resize-none outline-none text-base placeholder:text-gray-400"
                            />
                            {/* Toolbar */}
                            <div className="flex items-center justify-between px-2 pb-2">
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600 rounded-full">
                                        <Plus className="w-5 h-5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600 rounded-full">
                                        <Smile className="w-5 h-5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600 rounded-full">
                                        <Paperclip className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600 rounded-full">
                                        <ImageIcon className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600 rounded-full">
                                        <Video className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600 rounded-full">
                                        <Mic className="w-4 h-4" />
                                    </Button>
                                </div>
                                <Button
                                    onClick={handleComment}
                                    disabled={!comment.trim() || isPending}
                                    className="bg-gray-200 hover:bg-gray-300 text-gray-600 hover:text-gray-900 rounded-full px-6 h-8 text-sm font-medium transition-colors"
                                >
                                    Paylaş
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
