"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { useRouter } from "next/navigation";

interface ChatSidebarProps {
    conversations: any[]; // Using any for agility, ideally types should be defined
    selectedId: string | undefined;
    onSelect: (id: string) => void;
}

export function ChatSidebar({ conversations, selectedId }: Omit<ChatSidebarProps, 'onSelect'> & { onSelect?: any }) {
    const router = useRouter();

    const handleSelect = (id: string) => {
        router.push(`/chat?c=${id}`);
    };

    return (
        <div className="w-72 border-r border-border flex flex-col bg-card h-full">
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
                <h2 className="font-semibold">Mesajlar</h2>
                <Button variant="ghost" size="icon">
                    <Plus className="w-4 h-4" />
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-border overflow-x-auto">
                <Button variant="ghost" size="sm" className="text-foreground font-medium shrink-0">Gelen Kutusu</Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground shrink-0">Okunmamış</Button>
            </div>

            {/* Search */}
            <div className="p-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="İsim ara..." className="pl-9 bg-muted/50" />
                </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                        Henüz sohbet yok. Yeni bir sohbet başlat!
                    </div>
                ) : (
                    conversations.map((conv) => {
                        const otherUser = conv.otherUser;
                        return (
                            <div
                                key={conv.id}
                                onClick={() => handleSelect(conv.id)}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 hover:bg-accent cursor-pointer transition-colors",
                                    selectedId === conv.id && "bg-accent"
                                )}
                            >
                                <Avatar className="w-10 h-10">
                                    <AvatarImage src={otherUser?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser?.id}`} />
                                    <AvatarFallback>{otherUser?.full_name?.[0] || '?'}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <span className={cn(
                                            "text-sm truncate",
                                            !conv.lastMessage?.is_read && conv.lastMessage?.sender_id !== otherUser?.id ? 'font-semibold' : 'font-medium'
                                        )}>
                                            {otherUser?.full_name || 'Bilinmeyen Kullanıcı'}
                                        </span>
                                        {conv.lastMessage && (
                                            <span className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(conv.lastMessage.created_at), { addSuffix: false, locale: tr })}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground truncate">
                                        {conv.lastMessage?.content || 'Mesaj yok'}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
