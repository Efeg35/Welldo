"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, ThumbsUp, MessageCircle, Bookmark, Share2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { toggleLike, deletePost, toggleBookmark } from "@/actions/community";
import { useOptimistic, useState, useTransition } from "react";
import { cn, getInitials } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Markdown from 'react-markdown';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, Trash, Share2 as ShareIcon } from "lucide-react";
import { CreatePost } from "@/components/community/create-post";
import { Profile } from "@/types";

import { Post } from "@/types";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface PostCardProps {
    post: Post;
    currentUserId: string | undefined;
    onClick?: (post: Post) => void;
}

// Helper to extract YouTube ID
function getYoutubeId(url: string) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

export function PostCard({ post, currentUserId, onClick }: PostCardProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    // Check for YouTube link in content
    const youtubeMatch = post.content?.match(/(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[^\s]+)/);
    const youtubeUrl = youtubeMatch ? youtubeMatch[0] : null;
    const youtubeId = youtubeUrl ? getYoutubeId(youtubeUrl) : null;

    // Check if current user has liked
    // Check if current user has liked
    const hasLiked = post.likes?.some((like) => like.user_id === currentUserId) || false;
    const hasBookmarked = post.bookmarks?.some((b: any) => b.user_id === currentUserId) || false;

    // Fallback logic for like count
    const initialLikeCount = post._count?.likes ?? post.likes?.length ?? 0;

    // Optimistic UI for likes
    const [optimisticState, addOptimisticState] = useOptimistic(
        { hasLiked, likeCount: initialLikeCount },
        (state, newHasLiked: boolean) => ({
            hasLiked: newHasLiked,
            likeCount: state.likeCount + (newHasLiked ? 1 : -1),
        })
    );

    const [isBookmarked, setIsBookmarked] = useState(hasBookmarked);

    const handleBookmark = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const newState = !isBookmarked;
        setIsBookmarked(newState); // Optimistic
        try {
            await toggleBookmark(post.id);
        } catch (err) {
            setIsBookmarked(!newState); // Revert
            toast.error("İşlem başarısız");
        }
    };

    const handleLike = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        startTransition(async () => {
            addOptimisticState(!optimisticState.hasLiked);
            await toggleLike(post.id, 'post');
        });
    };

    const handleShare = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const url = `${window.location.origin}/community/post/${post.id}`;
        navigator.clipboard.writeText(url);
        toast.success("Bağlantı kopyalandı!");
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDeleteOpen(true);
    };

    const confirmDelete = async () => {
        try {
            await deletePost(post.id);
            toast.success("Gönderi silindi");
            setIsDeleteOpen(false);
            router.refresh();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Silme işlemi başarısız");
        }
    };

    const canManage = currentUserId === post.user_id;

    return (
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                        <AvatarImage src={(post.profiles?.avatar_url as string) || undefined} />
                        <AvatarFallback className="bg-gray-100 text-gray-700 font-semibold text-sm">
                            {getInitials(post.profiles?.full_name as string)}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{post.profiles?.full_name}</span>
                            {post.profiles?.role === 'instructor' && (
                                <span className="text-[10px] bg-gray-900 text-white font-bold px-1.5 py-0.5 rounded-full uppercase">
                                    Eğitmen
                                </span>
                            )}
                            {post.profiles?.role === 'admin' && (
                                <span className="text-[10px] bg-gray-700 text-white font-bold px-1.5 py-0.5 rounded-full uppercase">
                                    Admin
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            {post.channel && (
                                <>
                                    <span>Posted in</span>
                                    <Link
                                        href={`/community/${post.channel.slug}`}
                                        className="text-gray-900 hover:underline font-medium"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {post.channel.name}
                                    </Link>
                                    <span>•</span>
                                </>
                            )}
                            <span>
                                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: tr })}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn("rounded-full hover:bg-muted/50 h-8 w-8", isBookmarked && "text-yellow-500")}
                        onClick={handleBookmark}
                    >
                        <Bookmark className={cn("w-4 h-4", isBookmarked && "fill-current")} />
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted/50 h-8 w-8">
                                <MoreHorizontal className="w-5 h-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            {canManage && (
                                <>
                                    <CreatePost user={{ id: currentUserId }} post={post}>
                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                                            <Edit className="w-4 h-4 mr-2" />
                                            Düzenle
                                        </DropdownMenuItem>
                                    </CreatePost>
                                    <DropdownMenuItem onClick={handleDeleteClick} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                                        <Trash className="w-4 h-4 mr-2" />
                                        Sil
                                    </DropdownMenuItem>
                                </>
                            )}
                            <DropdownMenuItem onClick={handleShare} className="cursor-pointer">
                                <ShareIcon className="w-4 h-4 mr-2" />
                                Paylaş
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <Link
                href={`/community/post/${post.id}`}
                className="block hover:bg-muted/30 transition-colors -mx-6 px-6 py-2 cursor-pointer"
                onClick={(e) => {
                    if (onClick) {
                        e.preventDefault();
                        onClick(post);
                    }
                }}
            >
                {post.title && <h3 className="font-bold text-lg mb-2">{post.title}</h3>}
                <div className="text-muted-foreground prose prose-sm dark:prose-invert max-w-none line-clamp-4">
                    <Markdown>{post.content}</Markdown>
                </div>
                {post.image_url && (
                    <div className="mt-3 rounded-lg overflow-hidden border border-border">
                        <img src={post.image_url} alt="Post Attachment" className="w-full h-auto object-cover max-h-[500px]" />
                    </div>
                )}
                {!post.image_url && youtubeId && (
                    <div className="mt-3 rounded-lg overflow-hidden border border-border aspect-video">
                        <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${youtubeId}`}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full"
                        ></iframe>
                    </div>
                )}
            </Link>

            <div className="flex items-center gap-4 pt-2 border-t border-border">
                <button
                    onClick={handleLike}
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
                    <span className="text-sm">
                        {post._count?.comments !== undefined
                            ? post._count.comments
                            : (post.comments?.[0]?.count ?? post.comments?.length ?? 0)}
                    </span>
                </Link>
                <button
                    onClick={handleBookmark}
                    className={cn(
                        "flex items-center gap-2 transition-colors",
                        isBookmarked ? "text-[#408FED]" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <Bookmark className={cn("w-4 h-4", isBookmarked && "fill-current")} />
                </button>
                <button
                    onClick={handleShare}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <Share2 className="w-4 h-4" />
                </button>
                {/* <span className="ml-auto text-sm text-muted-foreground">Deniz ve diğer 5 kişi beğendi</span> */}
                <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                    <DialogContent onClick={(e) => e.stopPropagation()}>
                        <DialogHeader>
                            <DialogTitle>Bu gönderiyi silmek istediğine emin misin?</DialogTitle>
                            <DialogDescription>
                                Bu işlem geri alınamaz. Bu gönderi kalıcı olarak silinecektir.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button variant="ghost" onClick={(e) => { e.stopPropagation(); setIsDeleteOpen(false); }}>İptal</Button>
                            <Button variant="destructive" onClick={(e) => { e.stopPropagation(); confirmDelete(); }}>Evet, Sil</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
