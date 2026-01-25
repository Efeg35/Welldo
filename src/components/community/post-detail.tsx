"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Profile } from "@/types";
import { PostContent } from "./post-content";

interface PostDetailProps {
    post: any;
    user: Profile;
}

export function PostDetail({ post, user }: PostDetailProps) {
    const router = useRouter();

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

            <div className="max-w-4xl mx-auto w-full px-0 md:px-6 py-0 md:py-8 overflow-y-auto flex-1">
                <div className="bg-white border-x md:border border-border md:rounded-xl shadow-sm overflow-hidden">
                    <PostContent post={post} user={user} />
                </div>
            </div>
        </div>
    );
}
