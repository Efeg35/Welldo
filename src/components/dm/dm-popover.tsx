"use client";

import { useState, useEffect } from "react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { MessageCircle, Plus, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getConversations } from "@/actions/dm";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { DirectMessageWindow } from "./dm-window";
import { Conversation } from "@/types/dm";
import { DirectMessageMainModal } from "./dm-main-modal";

export function DirectMessagePopover() {
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'inbox' | 'unread'>('inbox');
    const [selectedConversation, setSelectedConversation] = useState<any>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [expandedMode, setExpandedMode] = useState<'chat' | 'new'>('chat');

    const loadConversations = async () => {
        setIsLoading(true);
        try {
            const data = await getConversations();
            setConversations(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (open && !selectedConversation) {
            loadConversations();
        }
    }, [open, selectedConversation]);

    const openExpanded = (mode: 'chat' | 'new') => {
        setOpen(false);
        setExpandedMode(mode);
        setIsExpanded(true);
    };

    const filteredConversations = conversations.filter(c => {
        if (activeTab === 'unread') {
            return false; // For now
        }
        return true;
    });

    return (
        <>
            <Popover open={open} onOpenChange={(val) => {
                setOpen(val);
                if (!val) setSelectedConversation(null);
            }}>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full relative">
                        <MessageCircle className="w-5 h-5" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-[400px] p-0 overflow-hidden rounded-xl shadow-2xl border-border">
                    <div className="flex flex-col h-[500px] bg-white">
                        {selectedConversation ? (
                            <DirectMessageWindow
                                conversationId={selectedConversation.id}
                                otherUser={selectedConversation.other_participant}
                                onBack={() => setSelectedConversation(null)}
                            />
                        ) : (
                            <>
                                {/* Header */}
                                <div className="p-4 flex items-center justify-between border-b bg-white">
                                    <h3 className="font-bold text-lg">Mesajlar</h3>
                                    <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md hover:bg-gray-100">
                                            <CheckCircle2 className="w-4 h-4 text-gray-500" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 rounded-md hover:bg-gray-100"
                                            onClick={() => openExpanded('new')}
                                        >
                                            <Plus className="w-4 h-4 text-gray-500" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Tabs */}
                                <div className="px-4 border-b flex items-center gap-4 bg-white">
                                    <button
                                        onClick={() => setActiveTab('inbox')}
                                        className={cn(
                                            "py-3 text-sm font-medium border-b-2 transition-colors",
                                            activeTab === 'inbox' ? "border-black text-black" : "border-transparent text-gray-500 hover:text-black"
                                        )}
                                    >
                                        Gelen Kutusu
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('unread')}
                                        className={cn(
                                            "py-3 text-sm font-medium border-b-2 transition-colors",
                                            activeTab === 'unread' ? "border-black text-black" : "border-transparent text-gray-500 hover:text-black"
                                        )}
                                    >
                                        Okunmamış
                                    </button>
                                </div>

                                {/* List */}
                                <div className="flex-1 overflow-y-auto bg-white">
                                    {isLoading ? (
                                        <div className="p-8 text-center text-sm text-gray-500">Yükleniyor...</div>
                                    ) : filteredConversations.length > 0 ? (
                                        <div className="divide-y">
                                            {filteredConversations.map(conv => (
                                                <button
                                                    key={conv.id}
                                                    onClick={() => setSelectedConversation(conv)}
                                                    className="w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left"
                                                >
                                                    <Avatar className="h-10 w-10">
                                                        <AvatarImage src={conv.other_participant?.avatar_url || undefined} />
                                                        <AvatarFallback>{conv.other_participant?.full_name?.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between mb-0.5">
                                                            <span className="font-bold text-sm truncate">{conv.other_participant?.full_name}</span>
                                                            <span className="text-[10px] text-gray-400">
                                                                {conv.last_message && formatDistanceToNow(new Date(conv.last_message.created_at), { addSuffix: false, locale: tr })}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-500 truncate line-clamp-1">
                                                            {conv.last_message?.content || "Henüz mesaj yok"}
                                                        </p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white">
                                            <div className="mb-4 text-gray-300">
                                                <MessageCircle className="w-16 h-16" strokeWidth={1} />
                                            </div>
                                            <h4 className="font-bold text-xl mb-1">Mesaj yok</h4>
                                            <p className="text-sm text-gray-500 mb-6">Üyelere özel mesaj gönder</p>
                                            <Button
                                                className="bg-gray-900 text-white hover:bg-gray-800 rounded-full px-6"
                                                onClick={() => openExpanded('new')}
                                            >
                                                Mesaj gönder
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </PopoverContent>
            </Popover>

            <DirectMessageMainModal
                open={isExpanded}
                onOpenChange={setIsExpanded}
                initialMode={expandedMode}
            />
        </>
    );
}
