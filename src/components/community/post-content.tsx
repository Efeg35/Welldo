"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThumbsUp, MessageCircle, Share2, Send, Bookmark, MoreHorizontal, Image as ImageIcon, Smile, Paperclip, Mic, Video, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { useState, useTransition, useOptimistic, useEffect } from "react";
import { createComment, toggleLike } from "@/actions/community";
import { cn, getInitials } from "@/lib/utils";
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

    // Sync with prop updates
    useEffect(() => {
        setPost(initialPost);
    }, [initialPost]);



    const hasLiked = post.likes?.some((like: any) => like.user_id === user.id) || false;
    const initialLikeCount = post._count?.likes || 0;

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
                // Optimistic update can be tricky with full profile data, 
                // so we wait for server response which is fast enough usually.
                // Or we can construct a pessimistic update immediately after await.
                const newComment = await createComment(post.id, comment);

                setComment("");

                if (newComment) {
                    // Update local state to show comment immediately
                    setPost((prev: any) => ({
                        ...prev,
                        comments: [...(prev.comments || []), newComment]
                    }));
                }

                toast.success("Yorum eklendi");
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
                            <AvatarFallback className="bg-gray-100/50 text-gray-600 font-semibold">
                                {getInitials(post.profiles?.full_name || post.profiles?.email || "U")}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="font-bold text-lg leading-none">
                                    {post.profiles?.full_name || (post.profiles?.email ? post.profiles.email.split('@')[0] : "İsimsiz Üye")}
                                </h2>
                                {post.profiles?.role === 'instructor' && (
                                    <span className="bg-gray-900 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Eğitmen</span>
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
                            optimisticLike.hasLiked ? "text-gray-900" : "text-muted-foreground hover:text-foreground"
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
                        <div key={c.id} className="flex gap-4 group animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <Avatar className="w-10 h-10 shrink-0 border border-gray-100">
                                <AvatarImage src={c.profiles?.avatar_url} />
                                <AvatarFallback className="bg-white text-gray-600 font-semibold text-sm">
                                    {getInitials(c.profiles?.full_name || c.profiles?.email || "U")}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-1.5 min-w-0">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-sm text-gray-900">
                                            {c.profiles?.full_name || (c.profiles?.email ? c.profiles.email.split('@')[0] : "İsimsiz Üye")}
                                        </span>
                                        {c.profiles?.role === 'instructor' && (
                                            <span className="bg-indigo-100 text-indigo-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase">Eğitmen</span>
                                        )}
                                        <span className="text-xs text-muted-foreground"> • {c.created_at && !isNaN(new Date(c.created_at).getTime())
                                            ? formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: tr })
                                            : 'şimdi'
                                        }</span>
                                    </div>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48">
                                            <DropdownMenuItem className="gap-2">
                                                <Bookmark className="w-4 h-4" /> Yorumu kaydet
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="gap-2">
                                                <MessageCircle className="w-4 h-4" /> Yorumu düzenle
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="gap-2" onClick={() => {
                                                navigator.clipboard.writeText(`${window.location.href}#comment-${c.id}`);
                                                toast.success("Link kopyalandı");
                                            }}>
                                                <Share2 className="w-4 h-4" /> Linki kopyala
                                            </DropdownMenuItem>
                                            {user.id === c.user_id && (
                                                <DropdownMenuItem className="gap-2 text-red-600 focus:text-red-600 focus:bg-red-50">
                                                    <span className="flex items-center gap-2 w-full">
                                                        {/* Trash icon would be better but keeping simple */}
                                                        Yorumu sil
                                                    </span>
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                                    {c.content}
                                </div>

                                <div className="flex items-center gap-4 pt-1">
                                    <button className="text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors">Beğen</button>
                                    <button className="text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors">Yanıtla</button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {post.comments?.length === 0 && (
                        <div className="text-center py-12">
                            <div className="bg-white p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3 shadow-sm border border-gray-100">
                                <MessageCircle className="w-6 h-6 text-gray-300" />
                            </div>
                            <h3 className="text-gray-900 font-medium mb-1">Henüz yorum yok</h3>
                            <p className="text-gray-500 text-sm">Bu gönderiye ilk yorumu sen yap!</p>
                        </div>
                    )}
                </div>

                {/* Comment Form - Clean & Minimal */}
                <div className="flex gap-4 border-t border-gray-100 pt-8">
                    <Avatar className="w-10 h-10 shrink-0 border border-gray-100">
                        <AvatarImage src={user.avatar_url || ""} />
                        <AvatarFallback className="bg-white text-gray-700 font-semibold text-sm">
                            {getInitials(user.full_name || user.email || "U")}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <div className="relative">
                            <div className={cn(
                                "bg-white border rounded-xl shadow-sm overflow-hidden transition-all duration-200",
                                "focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500",
                                "border-gray-200"
                            )}>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Düşüncelerini paylaş..."
                                    className="w-full bg-transparent border-none p-4 min-h-[50px] max-h-[200px] resize-y outline-none text-sm placeholder:text-gray-400"
                                    rows={1}
                                    style={{ minHeight: '50px' }}
                                    onInput={(e) => {
                                        const target = e.target as HTMLTextAreaElement;
                                        target.style.height = 'auto';
                                        target.style.height = target.scrollHeight + 'px';
                                    }}
                                />
                                <div className="flex items-center justify-between px-2 pb-2 bg-white">
                                    <div className="flex items-center gap-1">
                                        {/* Minimal attachment icons only */}
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full">
                                            <ImageIcon className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    <Button
                                        onClick={handleComment}
                                        disabled={!comment.trim() || isPending}
                                        className={cn(
                                            "rounded-full px-4 h-8 text-xs font-semibold transition-all",
                                            comment.trim()
                                                ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                                                : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                        )}
                                    >
                                        {isPending ? 'Gönderiliyor...' : 'Paylaş'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
