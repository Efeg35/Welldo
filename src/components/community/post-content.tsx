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
import { toggleCommentLike, deleteComment, toggleCommentBookmark, editComment, deletePost, editPost, toggleBookmark, getComments } from "@/actions/community";
import { Pencil, Trash } from "lucide-react";

interface CommentItemProps {
    comment: any;
    user: Profile;
    post: Post;
    onReply: (commentId: string, username: string) => void;
}

function CommentItem({ comment, user, post, onReply }: CommentItemProps) {
    const [isPending, startTransition] = useTransition();
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);

    // Optimistic Like State
    const hasLiked = comment.likes?.some((like: any) => like.user_id === user.id) || false;
    const initialLikeCount = comment._count?.likes || 0;

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
            await toggleCommentLike(comment.id);
        });
    };

    const handleDelete = () => {
        if (!confirm("Yorumu silmek istediğinize emin misiniz?")) return;
        startTransition(async () => {
            try {
                await deleteComment(comment.id);
                toast.success("Yorum silindi");
            } catch (error) {
                toast.error("Yorum silinemedi");
            }
        });
    };

    const handleBookmark = () => {
        startTransition(async () => {
            try {
                await toggleCommentBookmark(comment.id);
                toast.success("Yorum kaydedildi");
            } catch (error) {
                toast.error("İşlem başarısız");
            }
        });
    };

    const handleEdit = () => {
        if (!editContent.trim()) return;
        startTransition(async () => {
            try {
                await editComment(comment.id, editContent);
                setIsEditing(false);
                toast.success("Yorum güncellendi");
            } catch (error) {
                toast.error("Yorum güncellenemedi");
            }
        });
    };

    return (
        <div className="flex gap-4 group animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Avatar className="w-10 h-10 shrink-0 border border-gray-100">
                <AvatarImage src={comment.profiles?.avatar_url} />
                <AvatarFallback className="bg-zinc-200 text-zinc-700 font-bold text-sm">
                    {getInitials(comment.profiles?.full_name || comment.profiles?.email || "U")}
                </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1.5 min-w-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-gray-900">
                            {comment.profiles?.full_name || (comment.profiles?.email ? comment.profiles.email.split('@')[0] : "İsimsiz Üye")}
                        </span>
                        {comment.profiles?.role === 'instructor' && (
                            <span className="bg-indigo-100 text-indigo-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase">Eğitmen</span>
                        )}
                        <span className="text-xs text-muted-foreground"> • {comment.created_at && !isNaN(new Date(comment.created_at).getTime())
                            ? formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: tr })
                            : 'şimdi'
                        }</span>
                        {comment.updated_at && comment.updated_at !== comment.created_at && (
                            <span className="text-xs text-muted-foreground/60 italic">(düzenlendi)</span>
                        )}
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem className="gap-2" onClick={handleBookmark}>
                                <Bookmark className="w-4 h-4" /> Yorumu kaydet
                            </DropdownMenuItem>
                            {user.id === comment.user_id && (
                                <DropdownMenuItem className="gap-2" onClick={() => setIsEditing(true)}>
                                    <Pencil className="w-4 h-4" /> Yorumu düzenle
                                </DropdownMenuItem>
                            )}
                            {(user.id === comment.user_id || user.role === 'admin' || user.role === 'instructor') && (
                                <DropdownMenuItem className="gap-2 text-red-600 focus:text-red-600 focus:bg-red-50" onClick={handleDelete}>
                                    <Trash className="w-4 h-4" /> Yorumu sil
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="gap-2" onClick={() => {
                                navigator.clipboard.writeText(`${window.location.href}#comment-${comment.id}`);
                                toast.success("Link kopyalandı");
                            }}>
                                <Share2 className="w-4 h-4" /> Linki kopyala
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {isEditing ? (
                    <div className="space-y-2">
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full p-2 border rounded-md text-sm focus:outline-indigo-500"
                            rows={3}
                        />
                        <div className="flex justify-end gap-2">
                            <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>İptal</Button>
                            <Button size="sm" onClick={handleEdit} disabled={isPending}>Kaydet</Button>
                        </div>
                    </div>
                ) : (
                    <div className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                        {comment.content}
                    </div>
                )}

                {!isEditing && (
                    <div className="flex items-center gap-4 pt-1">
                        <button
                            onClick={handleLike}
                            className={cn(
                                "text-xs font-semibold transition-colors flex items-center gap-1",
                                optimisticLike.hasLiked ? "text-indigo-600" : "text-gray-500 hover:text-gray-900"
                            )}
                        >
                            {optimisticLike.hasLiked ? 'Beğendin' : 'Beğen'}
                            {optimisticLike.likeCount > 0 && <span className="ml-0.5">({optimisticLike.likeCount})</span>}
                        </button>
                        <button
                            onClick={() => onReply(comment.id, comment.profiles?.full_name || "Üye")}
                            className="text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
                        >
                            Yanıtla
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

interface PostContentProps {
    post: Post;
    user: Profile;
    layoutMode?: 'default' | 'modal';
}

export function PostContent({ post: initialPost, user, layoutMode = 'default' }: PostContentProps) {
    const [comment, setComment] = useState("");
    const [replyTo, setReplyTo] = useState<{ id: string, username: string } | null>(null);
    const [isPending, startTransition] = useTransition();
    const [post, setPost] = useState(initialPost);
    const [isEditingPost, setIsEditingPost] = useState(false);
    const [editPostContent, setEditPostContent] = useState(initialPost.content);

    // Sync with prop updates
    useEffect(() => {
        setPost(initialPost);

        // Check if comments need fetching (e.g. came from feed with only count)
        const comments = initialPost.comments || [];
        const isSparse = comments.length > 0 && !(comments[0] as any).id;

        if (isSparse) {
            startTransition(async () => {
                const fullComments = await getComments(initialPost.id, 'post');
                setPost(prev => ({ ...prev, comments: fullComments }));
            });
        }
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
                const newComment = await createComment(post.id, comment, 'post', replyTo?.id);

                setComment("");
                setReplyTo(null);

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

    const handleDeletePost = () => {
        if (!confirm("Bu gönderiyi silmek istediğinize emin misiniz?")) return;
        startTransition(async () => {
            try {
                await deletePost(post.id);
                toast.success("Gönderi silindi");
            } catch (error) {
                toast.error("Gönderi silinemedi");
            }
        });
    };

    const handleBookmarkPost = () => {
        startTransition(async () => {
            try {
                await toggleBookmark(post.id);
                toast.success("Gönderi kaydedildi");
            } catch (error) {
                toast.error("İşlem başarısız");
            }
        });
    };

    const handleEditPost = () => {
        if (!editPostContent.trim()) return;
        startTransition(async () => {
            try {
                // Assuming title and topic are not editable here for now or just passing current
                await editPost(post.id, post.title, editPostContent, post.topic);
                setIsEditingPost(false);
                toast.success("Gönderi güncellendi");
            } catch (error) {
                toast.error("Gönderi güncellenemedi");
            }
        });
    };


    // Layout splitting for Modal Mode
    // Default mode: space-y-6 container
    // Modal mode: flex flex-col h-full
    // Layout splitting for Modal Mode
    // Default mode: space-y-6 container
    // Modal mode: flex flex-col h-full
    const wrapperClass = layoutMode === 'modal' ? 'flex flex-col h-full bg-white sm:rounded-xl overflow-hidden' : 'space-y-6';

    const scrollContainerClass = layoutMode === 'modal' ? 'flex-1 overflow-y-auto' : '';
    const footerClass = layoutMode === 'modal' ? 'border-t border-gray-100 bg-white p-4 z-10 shrink-0' : 'bg-gray-50/50 p-6 md:p-8 pt-0';

    return (
        <div className={wrapperClass}>
            <div className={scrollContainerClass}>
                {/* Main Post Card */}
                <div className={cn("bg-white p-6 md:p-8", layoutMode === 'default' && "border-b border-border")}>
                    <div className={cn("flex items-start justify-between mb-6", layoutMode === 'modal' && "pr-24")}>
                        <div className="flex items-center gap-4">
                            <Avatar className="w-12 h-12">
                                <AvatarImage src={post.profiles?.avatar_url || ""} />
                                <AvatarFallback className="bg-zinc-200 text-zinc-700 font-bold">
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
                                <DropdownMenuItem className="gap-2" onClick={handleBookmarkPost}>
                                    <Bookmark className="w-4 h-4" /> Gönderiyi kaydet
                                </DropdownMenuItem>
                                {user.id === post.user_id && (
                                    <DropdownMenuItem className="gap-2" onClick={() => setIsEditingPost(true)}>
                                        <Pencil className="w-4 h-4" /> Gönderiyi düzenle
                                    </DropdownMenuItem>
                                )}
                                {(user.id === post.user_id || user.role === 'admin' || user.role === 'instructor' || (post.community && user.id === post.community.owner_id)) && (
                                    <DropdownMenuItem className="gap-2 text-red-600 focus:text-red-600 focus:bg-red-50" onClick={handleDeletePost}>
                                        <Trash className="w-4 h-4" /> Gönderiyi sil
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={handleShare} className="gap-2">
                                    <Share2 className="w-4 h-4" /> Paylaş
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <div className="space-y-4">
                        {post.title && <h3 className="text-2xl font-bold tracking-tight">{post.title}</h3>}
                        {isEditingPost ? (
                            <div className="space-y-4">
                                <textarea
                                    value={editPostContent}
                                    onChange={(e) => setEditPostContent(e.target.value)}
                                    className="w-full p-4 border rounded-xl text-base focus:outline-indigo-500 bg-gray-50/50"
                                    rows={6}
                                />
                                <div className="flex justify-end gap-2">
                                    <Button size="sm" variant="ghost" onClick={() => setIsEditingPost(false)}>İptal</Button>
                                    <Button size="sm" onClick={handleEditPost} disabled={isPending}>Kaydet</Button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-lg leading-relaxed text-foreground/90 prose prose-zinc dark:prose-invert max-w-none">
                                <Markdown>{post.content}</Markdown>
                            </div>
                        )}
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
                            {!post.settings?.hide_likes && <span>{optimisticLike.likeCount} Beğeni</span>}
                        </button>
                        {!post.settings?.hide_comments && (
                            <div className="flex items-center gap-2 text-muted-foreground font-medium">
                                <MessageCircle className="w-5 h-5" />
                                <span>{post.comments?.length || 0} Yorum</span>
                            </div>
                        )}
                    </div>
                </div>



                {/* Comments Section */}
                <div className={cn("space-y-8", layoutMode === 'modal' ? "p-6 md:p-8 bg-gray-50/50 min-h-full" : "bg-gray-50/50 p-6 md:p-8")}>
                    {/* Comments List */}
                    <div className="space-y-6">
                        {(post.comments || [])
                            .filter((c: any) => c.id && !c.parent_id)
                            .map((c: any) => (
                                <div key={c.id} className="space-y-4">
                                    <CommentItem
                                        comment={c}
                                        user={user}
                                        post={post}
                                        onReply={(id, username) => {
                                            setReplyTo({ id, username });
                                            const input = document.querySelector('textarea');
                                            if (input) input.focus();
                                        }}
                                    />
                                    {(post.comments || [])
                                        .filter((reply: any) => reply.id && reply.parent_id === c.id)
                                        .map((reply: any) => (
                                            <div key={reply.id} className="pl-12">
                                                <CommentItem
                                                    comment={reply}
                                                    user={user}
                                                    post={post}
                                                    onReply={(id, username) => {
                                                        setReplyTo({ id, username });
                                                        const input = document.querySelector('textarea');
                                                        if (input) input.focus();
                                                    }}
                                                />
                                            </div>
                                        ))
                                    }
                                </div>
                            ))}
                        {post.comments?.length === 0 && (
                            <div className="text-center py-16 flex flex-col items-center justify-center p-8 bg-white/50 rounded-2xl border border-dashed border-gray-200">
                                <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 mb-3">
                                    <MessageCircle className="w-8 h-8 text-indigo-500/80" />
                                </div>
                                <h3 className="text-gray-900 font-semibold mb-1">Henüz yorum yok</h3>
                                <p className="text-gray-500 text-sm max-w-[250px]">
                                    Bu gönderiye henüz yorum yapılmamış. İlk yorumu sen yaparak tartışmayı başlat!
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Sticky Footer: Comment Form */}
            <div className={footerClass}>
                {!post.settings?.comments_closed ? (
                    <div className={cn("flex gap-4", layoutMode === 'default' && "border-t border-gray-100 pt-8")}>
                        <Avatar className="w-10 h-10 shrink-0 border border-gray-100">
                            <AvatarImage src={user.avatar_url || ""} />
                            <AvatarFallback className="bg-zinc-200 text-zinc-700 font-bold text-sm">
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
                                        placeholder={replyTo ? `@${replyTo.username} adlı kullanıcıya yanıt ver...` : "Düşüncelerini paylaş..."}
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
                                            {replyTo && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setReplyTo(null)}
                                                    className="h-6 text-xs text-red-500 hover:bg-red-50 hover:text-red-600 px-2"
                                                >
                                                    Yanıt iptal
                                                </Button>
                                            )}
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
                ) : (
                    <div className={cn("text-center text-gray-500 text-sm", layoutMode === 'default' && "border-t border-gray-100 pt-8")}>
                        Bu gönderi yorumlara kapatılmıştır.
                    </div>
                )}
            </div >
        </div>
    );
}
