"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface CommentListProps {
    comments: any[];
}

export function CommentList({ comments }: CommentListProps) {
    return (
        <div className="space-y-4">
            {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                    <Avatar className="w-8 h-8">
                        <AvatarImage src={comment.profiles.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.profiles.id}`} />
                        <AvatarFallback>{comment.profiles.full_name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="bg-muted/50 rounded-lg p-3 flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm">{comment.profiles.full_name}</span>
                            <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: tr })}</span>
                        </div>
                        <p className="text-sm text-foreground">{comment.content}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
