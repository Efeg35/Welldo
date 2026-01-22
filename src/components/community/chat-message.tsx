"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Message, Profile } from "@/types";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
    message: Message;
    isContinuous?: boolean; // If true, hide avatar/name for consecutive messages from same user
}

export function ChatMessage({ message, isContinuous = false }: ChatMessageProps) {
    const user = message.user;
    // Fallback if user join failed
    const userName = user?.full_name || "Bilinmeyen Kullanıcı";
    const userRole = user?.role === 'admin' ? 'Yönetici' : user?.role === 'instructor' ? 'Eğitmen' : '';

    return (
        <div className={cn("group flex gap-4 px-4 py-1 hover:bg-gray-50/50 transition-colors", isContinuous ? "pt-0.5 pb-0.5" : "mt-2 pt-2")}>
            {/* Avatar Column */}
            <div className="w-10 flex-shrink-0">
                {!isContinuous && (
                    <Avatar className="w-10 h-10 cursor-pointer hover:opacity-90 transition-opacity">
                        <AvatarImage src={user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`} />
                        <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
                    </Avatar>
                )}
                {isContinuous && (
                    <div className="w-10 h-full opacity-0 group-hover:opacity-100 text-[10px] text-muted-foreground flex items-center justify-center">
                        {/* Optionally show time on hover for continuous messages */}
                        {format(new Date(message.created_at), 'HH:mm')}
                    </div>
                )}
            </div>

            {/* Content Column */}
            <div className="flex-1 min-w-0">
                {!isContinuous && (
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-[15px] text-gray-900 cursor-pointer hover:underline">
                            {userName}
                        </span>
                        {userRole && (
                            <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider">
                                {userRole === 'Yönetici' ? 'ADMIN' : userRole}
                            </span>
                        )}
                        <span className="text-xs text-muted-foreground ml-1">
                            {format(new Date(message.created_at), 'hh:mm a')}
                        </span>
                    </div>
                )}

                <div className="text-[15px] text-gray-800 leading-relaxed whitespace-pre-wrap break-words">
                    {message.content}
                </div>
            </div>
        </div>
    );
}
