"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Message, Profile } from "@/types";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Image as ImageIcon, FileText, Paperclip } from "lucide-react";

interface ChatMessageProps {
    message: Message;
    isContinuous?: boolean; // If true, hide avatar/name for consecutive messages from same user
    currentUser?: Profile;
}

export function ChatMessage({ message, isContinuous = false, currentUser }: ChatMessageProps) {
    // Robustly find user profile from either 'user' or 'profiles' join
    let user = message.user || (message as any).profiles;

    // Fallback to currentUser if IDs match and joined profile is incomplete
    if (currentUser && message.user_id === currentUser.id) {
        user = {
            ...user,
            ...currentUser,
            // Prioritize database role if exists, but fallback to current session
            role: user?.role || currentUser.role,
            full_name: user?.full_name || currentUser.full_name
        };
    }

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

                {/* Attachments */}
                {message.attachments && Array.isArray(message.attachments) && message.attachments.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                        {message.attachments.map((att: any, i: number) => (
                            <div key={i} className="group relative">
                                {att.type.startsWith('image/') ? (
                                    <a href={att.url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg border border-border bg-muted/40 max-w-[300px]">
                                        <img
                                            src={att.url}
                                            alt={att.name}
                                            className="max-h-[300px] w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                    </a>
                                ) : (
                                    <a
                                        href={att.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 rounded-lg border border-border bg-gray-50 p-3 transition-colors hover:bg-gray-100 max-w-sm"
                                    >
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                                            <Paperclip className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="truncate text-sm font-medium text-foreground">{att.name}</p>
                                            <p className="text-xs text-muted-foreground">{Math.round(att.size / 1024)} KB</p>
                                        </div>
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
