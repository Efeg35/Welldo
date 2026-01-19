"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus, Send } from "lucide-react";
import { createPost } from "@/actions/community";
import { useState, useTransition } from "react";

interface CreatePostProps {
    user: any;
    channelId?: string;
    communityId?: string;
}

export function CreatePost({ user, channelId, communityId }: CreatePostProps) {
    const [content, setContent] = useState("");
    const [isPending, startTransition] = useTransition();
    const [isExpanded, setIsExpanded] = useState(false);

    const handleSubmit = async () => {
        if (!content.trim()) return;

        startTransition(async () => {
            try {
                await createPost(content, channelId, communityId);
                setContent("");
                setIsExpanded(false);
            } catch (error) {
                console.error("Failed to create post", error);
            }
        });
    };

    return (
        <div className="bg-card border border-border rounded-xl p-4 transition-all duration-200">
            <div className="flex gap-4">
                <Avatar className="w-10 h-10">
                    <AvatarImage src={user ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}` : undefined} />
                    <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onFocus={() => setIsExpanded(true)}
                        placeholder="Toplulukla bir şeyler paylaş..."
                        className="w-full bg-transparent text-foreground placeholder:text-muted-foreground outline-none resize-none min-h-[40px]"
                        rows={isExpanded ? 3 : 1}
                    />

                    {isExpanded && (
                        <div className="flex justify-end gap-2 animate-in fade-in slide-in-from-top-1">
                            <Button variant="ghost" size="sm" onClick={() => setIsExpanded(false)}>
                                İptal
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleSubmit}
                                disabled={isPending || !content.trim()}
                                style={{ background: 'linear-gradient(135deg, #408FED 0%, #3E1BC9 100%)' }}
                            >
                                {isPending ? "Paylaşılıyor..." : "Paylaş"}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
