"use client";

import { Channel, Profile, Message } from "@/types";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { useEffect, useRef, useState } from "react";
import { sendChannelMessage } from "@/actions/chat";
import { createClient } from "@/lib/supabase/client";
import { Search, MoveRight, MoreHorizontal, Lock, Users, Info, SquareActivity, X, BellOff, LogOut, PanelRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface ChatFeedProps {
    channel: Channel;
    user: Profile;
    initialMessages: Message[];
}

export function ChatFeed({ channel, user, initialMessages }: ChatFeedProps) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const scrollRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    // Scroll to bottom on load and new messages (only if not searching)
    useEffect(() => {
        if (scrollRef.current && !searchQuery) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, searchQuery]);

    // Focus search input on open
    useEffect(() => {
        if (isSearchOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isSearchOpen]);

    // Realtime subscription
    useEffect(() => {
        const channelSub = supabase
            .channel(`public:messages:channel_id=eq.${channel.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `channel_id=eq.${channel.id}`
                },
                async (payload) => {
                    const newMessage = payload.new as Message;
                    const { data: fullMessage } = await supabase
                        .from('messages')
                        .select(`*, user:profiles(*)`)
                        .eq('id', newMessage.id)
                        .single();

                    if (fullMessage) {
                        setMessages(prev => [...prev, fullMessage]);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channelSub);
        };
    }, [channel.id, supabase]);

    const handleSendMessage = async (content: string) => {
        await sendChannelMessage(channel.id, content);
    };

    const filteredMessages = searchQuery
        ? messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
        : messages;

    return (
        <div className="flex h-full bg-white">
            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0 border-r border-border transition-all duration-300">
                {/* Header */}
                <div className="h-16 border-b border-border flex items-center justify-between px-6 flex-shrink-0 bg-white z-10 transition-all">
                    {isSearchOpen ? (
                        <div className="flex items-center w-full gap-2 animate-in fade-in slide-in-from-top-1">
                            <Search className="w-5 h-5 text-muted-foreground" />
                            <Input
                                ref={searchInputRef}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Mesajlarda ara..."
                                className="border-none shadow-none focus-visible:ring-0 flex-1 h-9 px-0"
                            />
                            <Button variant="ghost" size="sm" onClick={() => { setIsSearchOpen(false); setSearchQuery(""); }}>
                                <span className="text-xs font-semibold text-muted-foreground uppercase">Kapat</span>
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                                <h1 className="text-xl font-bold text-foreground">{channel.name}</h1>
                            </div>

                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-foreground"
                                    onClick={() => setIsSearchOpen(true)}
                                    title="Ara"
                                >
                                    <Search className="w-5 h-5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-foreground hidden lg:flex"
                                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                    title={isSidebarOpen ? "Detayları Gizle" : "Detayları Göster"}
                                >
                                    <PanelRight className="w-5 h-5" />
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                                            <MoreHorizontal className="w-5 h-5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem className="cursor-pointer">
                                            <BellOff className="w-4 h-4 mr-2" />
                                            <span>Bildirimleri Sustur</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-700">
                                            <LogOut className="w-4 h-4 mr-2" />
                                            <span>Kanaldan Ayrıl</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </>
                    )}
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                                <span className="text-2xl font-bold">#</span>
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-1">
                                {channel.name} kanalına hoş geldiniz
                            </h3>
                            <p>Burası sohbetin başlangıcı.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col pb-4">
                            {/* Filter/Search No Results */}
                            {searchQuery && filteredMessages.length === 0 && (
                                <div className="text-center py-10 text-muted-foreground">
                                    <p>"{searchQuery}" için sonuç bulunamadı.</p>
                                </div>
                            )}

                            {/* Simple Date Divider Example - can be dynamic later */}
                            {!searchQuery && (
                                <div className="flex items-center justify-center my-6">
                                    <span className="text-xs font-semibold text-muted-foreground bg-gray-50 px-3 py-1 rounded-full uppercase tracking-wider">
                                        Bugün
                                    </span>
                                </div>
                            )}

                            {filteredMessages.map((msg, index) => {
                                // Check if previous message was from same user within reasonable time to group
                                const prevMsg = filteredMessages[index - 1];
                                const isContinuous = !searchQuery && prevMsg &&
                                    prevMsg.user_id === msg.user_id &&
                                    (new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() < 5 * 60 * 1000); // 5 min

                                return (
                                    <ChatMessage
                                        key={msg.id}
                                        message={msg}
                                        isContinuous={!!isContinuous}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <ChatInput onSend={handleSendMessage} disabled={!!searchQuery} />
            </div>

            {/* Right Sidebar (Details) */}
            {isSidebarOpen && (
                <div className="w-80 flex-shrink-0 bg-white hidden lg:flex flex-col border-l border-border animate-in slide-in-from-right-5 duration-300">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold">Detaylar</h2>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Users className="w-4 h-4" />
                                <span>1</span>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Offline/Member Status */}
                            <div>
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Çevrimdışı</h3>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                                        {user.full_name?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">{user.full_name}</span>
                                            <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded-full uppercase">Yönetici</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Actions List similar to screenshot */}
                            <div className="space-y-1">
                                <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground h-9 px-2 gap-3 font-normal">
                                    <Lock className="w-4 h-4" />
                                    Erişim
                                </Button>
                                <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground h-9 px-2 gap-3 font-normal">
                                    <SquareActivity className="w-4 h-4" />
                                    İş akışları
                                </Button>
                                <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground h-9 px-2 gap-3 font-normal">
                                    <UserInfoItem icon={<Info className="w-4 h-4" />} label="Seçenekler" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function UserInfoItem({ icon, label }: { icon: React.ReactNode, label: string }) {
    return (
        <>
            {icon}
            <span>{label}</span>
        </>
    )
}
