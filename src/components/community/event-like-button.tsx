"use client";

import { useState } from "react";
import { toggleLike } from "@/actions/community";
import { cn } from "@/lib/utils";

interface EventLikeButtonProps {
    eventId: string;
    initialLikes: number;
    initialIsLiked: boolean;
    userId?: string;
}

export function EventLikeButton({
    eventId,
    initialLikes,
    initialIsLiked,
    userId
}: EventLikeButtonProps) {
    const [likes, setLikes] = useState(initialLikes);
    const [isLiked, setIsLiked] = useState(initialIsLiked);
    const [loading, setLoading] = useState(false);

    const handleToggle = async () => {
        if (!userId) return; // Or show login
        if (loading) return;

        // Optimistic update
        const newIsLiked = !isLiked;
        setIsLiked(newIsLiked);
        setLikes(prev => newIsLiked ? prev + 1 : prev - 1);
        setLoading(true);

        try {
            await toggleLike(eventId, 'event');
        } catch (error) {
            // Revert
            setIsLiked(!newIsLiked);
            setLikes(prev => !newIsLiked ? prev + 1 : prev - 1);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleToggle}
            disabled={!userId || loading}
            className={cn(
                "flex items-center gap-2 transition-colors group",
                isLiked ? "text-red-500" : "text-muted-foreground hover:text-red-500"
            )}
        >
            <svg
                width="20" height="20" viewBox="0 0 15 15" fill={isLiked ? "currentColor" : "none"}
                xmlns="http://www.w3.org/2000/svg"
                className={cn("transition-transform group-active:scale-95", isLiked ? "" : "group-hover:scale-110")}
            >
                <path d="M7.49999 2.20335C6.47466 1.05048 4.75704 0.942783 3.42582 1.83226C2.09459 2.72173 1.76739 4.41733 2.65089 5.67664L7.49999 12.5L12.3491 5.67664C13.2326 4.41733 12.9054 2.72173 11.5742 1.83226C10.243 0.942783 8.52533 1.05048 7.49999 2.20335Z" stroke="currentColor" fill={isLiked ? "currentColor" : "none"}></path>
            </svg>
            <span className="text-sm font-medium">
                {isLiked ? 'Beğendin' : 'Beğen'} ({likes})
            </span>
        </button>
    );
}
