"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

interface CommentListProps {
    comments: any[];
}

export function CommentList({ comments }: CommentListProps) {
    return (
        <div className="space-y-6">
            {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 group">
                    <Avatar className="w-8 h-8 mt-1">
                        <AvatarImage src={comment.profiles.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.profiles.id}`} />
                        <AvatarFallback>{comment.profiles.full_name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">{comment.profiles.full_name}</span>

                            {/* Optional: Add Admin/Host Badge if role available - skipping specific logic for now, using placeholder logic if relevant 
                                For now just simple text fidelity matches cleanly. 
                            */}
                            {comment.profiles.role === 'admin' && (
                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-zinc-700 text-white hover:bg-zinc-600">Admin</Badge>
                            )}

                            <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: tr })}
                            </span>
                        </div>

                        <div className="text-sm text-foreground/90 mb-2 leading-relaxed">
                            {comment.content}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-4">
                            <button className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                                Beğen
                            </button>
                            <button className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                                Yanıtla
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
