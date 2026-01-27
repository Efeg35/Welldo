
"use client";

import { useEffect, useState } from "react";
import { CommentList } from "./comment-list";
import { CreateComment } from "./create-comment";
import { getComments } from "@/actions/community";

interface EventCommentsProps {
    eventId: string;
    user: any;
}

export function EventComments({ eventId, user }: EventCommentsProps) {
    const [comments, setComments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadComments = async () => {
            try {
                const data = await getComments(eventId, 'event');
                setComments(data || []);
            } catch (error) {
                console.error("Failed to load comments", error);
            } finally {
                setLoading(false);
            }
        };

        loadComments();
    }, [eventId]);

    // Listen for realtime updates? ideally yes, but for now revalidatePath handles it on submission. 
    // However, since this is a client component fetching data on mount, it might need manual refresh or server component pattern.
    // Actually, `getComments` is a server action so `revalidatePath` won't update this client state automatically unless we use router.refresh().
    // For MVP, we'll keep it simple: initial load. 
    // BUT! Since `CreateComment` does `revalidatePath`, and `page.tsx` is an RSC, 
    // it's better if `EventComments` receives comments as a prop OR `page.tsx` fetches them.
    // The previous design in `page.tsx` was RSC. 
    // Let's change strategy: Fetch in `page.tsx` (RSC) and pass to a `CommentSection` component.

    // Changing plan: This component will just be the wrapper assuming comments are passed or fetched?
    // No, let's Stick to the CLIENT FETCH pattern for comments usually to allow easy polling/updates, 
    // OR fetch in RSC. 

    // Better strategy:
    // 1. `EventComments` is a proper component that takes `initialComments`.
    // 2. `page.tsx` fetches initial comments.

    return (
        <div className="space-y-6">
            <h2 className="font-semibold text-lg">Yorumlar ({comments.length})</h2>

            <CommentList comments={comments} />

            {user && (
                <div className="bg-gray-50 p-4 rounded-xl">
                    <CreateComment eventId={eventId} user={user} />
                </div>
            )}
        </div>
    );
}
