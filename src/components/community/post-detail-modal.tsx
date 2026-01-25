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
            <DialogContent className="max-w-4xl h-[85vh] p-0 gap-0 overflow-hidden flex flex-col sm:rounded-xl">
                {/* Custom Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white shrink-0">
                    <DialogTitle className="text-xl font-bold truncate pr-4">
                        {post.title || "Gönderi"}
                    </DialogTitle>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600 rounded-full h-8 w-8">
                            <Bookmark className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600 rounded-full h-8 w-8">
                            <MoreHorizontal className="w-5 h-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-400 hover:text-gray-600 rounded-full h-8 w-8"
                            onClick={handleExpand}
                        >
                            <Maximize2 className="w-5 h-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-400 hover:text-gray-600 rounded-full h-8 w-8 ml-2"
                            onClick={onClose}
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-gray-50/50">
                    <div className="px-0 md:px-0 py-0">
                        {/* We modify styles slightly for modal context if needed, but PostContent is generic */}
                        <PostContent post={post} user={user} />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
