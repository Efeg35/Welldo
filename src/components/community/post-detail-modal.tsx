"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Maximize2, X, MoreHorizontal, Bookmark } from "lucide-react";
import { PostContent } from "./post-content";
import { Post, Profile } from "@/types";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface PostDetailModalProps {
    post: Post | null;
    user: Profile;
    isOpen: boolean;
    onClose: () => void;
}

export function PostDetailModal({ post, user, isOpen, onClose }: PostDetailModalProps) {
    const router = useRouter();

    if (!post) return null;

    const handleExpand = () => {
        router.push(`/community/post/${post.id}`);
        onClose(); // Optional? Navigating away usually unmounts/hides overlay but safer to close.
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-6xl sm:max-w-6xl h-[85vh] p-0 gap-0 overflow-hidden flex flex-col sm:rounded-xl">
                <DialogTitle className="sr-only">Gönderi Detayı</DialogTitle>
                {/* Custom Header */}
                <div className="absolute right-4 top-4 z-50 flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="bg-white/80 backdrop-blur-sm hover:bg-white text-gray-500 hover:text-gray-900 rounded-full h-8 w-8 shadow-sm border border-gray-100/50"
                        onClick={handleExpand}
                        title="Tam ekran"
                    >
                        <Maximize2 className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="bg-white/80 backdrop-blur-sm hover:bg-white text-gray-500 hover:text-gray-900 rounded-full h-8 w-8 shadow-sm border border-gray-100/50"
                        onClick={onClose}
                        title="Kapat"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                {/* Content */}
                <div className="flex-1 min-h-0 bg-white">
                    <PostContent post={post} user={user} layoutMode="modal" />
                </div>
            </DialogContent>
        </Dialog>
    );
}
