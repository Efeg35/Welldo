"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { createComment } from "@/actions/community";
import { useState, useTransition } from "react";
import { Send } from "lucide-react";

interface CreateCommentProps {
    postId: string;
    user: any;
}

export function CreateComment({ postId, user }: CreateCommentProps) {
    const [content, setContent] = useState("");
    const [isPending, startTransition] = useTransition();

    const handleSubmit = async () => {
        if (!content.trim()) return;

        startTransition(async () => {
            try {
                await createComment(postId, content);
                setContent("");
            } catch (error) {
                console.error("Failed to create comment", error);
            }
        });
    };

    return (
        <div className="flex gap-4 items-start">
            <Avatar className="w-8 h-8">
                <AvatarImage src={user ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}` : undefined} />
                <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div className="flex-1 relative">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Yorum yaz..."
                    className="w-full bg-card border border-border rounded-lg p-3 pr-12 text-sm focus:outline-none focus:ring-1 focus:ring-primary min-h-[40px] resize-none"
                    rows={content.length > 50 ? 3 : 1}
                />
                <Button
                    size="icon"
                    variant="ghost"
                    className="absolute right-2 top-1.5 h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                    onClick={handleSubmit}
                    disabled={!content.trim() || isPending}
                >
                    <Send className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}
