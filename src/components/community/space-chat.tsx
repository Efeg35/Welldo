"use client";

import { Channel, Profile, Message } from "@/types";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { useEffect, useRef, useState, useMemo } from "react";
import { sendChannelMessage, uploadFile, getChannelMessages } from "@/actions/chat";
import { createClient } from "@/lib/supabase/client";
import { Search, Hash, Users, Bell, LogOut, PanelRightClose, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { SpaceSettingsDialog } from "./space-settings-dialog";
import { DeleteSpaceDialog } from "./delete-space-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Trash2, Settings } from "lucide-react";

interface SpaceChatProps {
    channel: Channel;
    user: Profile;
    initialMessages: Message[];
    members?: Profile[];
}

export function SpaceChat({ channel, user, initialMessages, members = [] }: SpaceChatProps) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

    // Ensure the current user is always included with the correct (potentially elevated) role
    const allMembers = useMemo(() => {
        const otherMembers = members.filter(m => m.id !== user.id);
        return [...otherMembers, user];
    }, [members, user]);

    const bottomRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    // Scroll to bottom on mount and new messages
    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior });
        }
    };

    useEffect(() => {
        // Instant scroll on initial load
        scrollToBottom('auto');
    }, []);

    useEffect(() => {
        // Smooth scroll for new messages
        if (!searchQuery) {
            scrollToBottom();
        }
    }, [messages, searchQuery]);

    // Realtime & Presence subscription
    useEffect(() => {
        const chatChannel = supabase.channel(`space_chat:${channel.id}`);

        chatChannel
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `channel_id=eq.${channel.id}`
                },
                async (payload) => {
                    // Fetch full message with user join
                    // Using both 'user' and 'profiles' for robustness against varying schema relationship names
                    const { data: fullMessage } = await supabase
                        .from('messages')
                        .select(`*, user:profiles(*), profiles:profiles!messages_user_id_fkey(*)`)
                        .eq('id', payload.new.id)
                        .single();

                    if (fullMessage) {
                        setMessages(prev => {
                            if (prev.some(m => m.id === fullMessage.id)) return prev;
                            const msgWithUser = {
                                ...fullMessage,
                                user: fullMessage.user || (fullMessage as any).profiles
                            };
                            return [...prev, msgWithUser];
                        });
                    }
                }
            )
            .on('presence', { event: 'sync' }, () => {
                const state = chatChannel.presenceState();
                const ids = new Set<string>();
                Object.values(state).forEach((presences: any) => {
                    presences.forEach((p: any) => {
                        if (p.user_id) ids.add(p.user_id);
                    });
                });
                setOnlineUserIds(ids);
            })
            .on('presence', { event: 'join' }, ({ newPresences }) => {
                // Potential to show "X joined" toast
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await chatChannel.track({
                        user_id: user.id,
                        online_at: new Date().toISOString(),
                    });
                }
            });

        return () => {
            supabase.removeChannel(chatChannel);
        };
    }, [channel.id, user.id, supabase]);

    const handleSendMessage = async (content: string, attachments: any[]) => {
        try {
            let uploadedAttachments: any[] = [];

            // Upload files if any
            if (attachments.length > 0) {
                // Use Promise.all for parallel uploads
                uploadedAttachments = await Promise.all(attachments.map(async (att) => {
                    if (att.file) {
                        try {
                            const result = await uploadFile(att.file, channel.id);
                            return result;
                        } catch (err) {
                            console.error("Upload failed for file", att.file.name, err);
                            return null;
                        }
                    }
                    return null;
                }));
                // Filter out failed uploads
                uploadedAttachments = uploadedAttachments.filter(Boolean);
            }

            await sendChannelMessage(channel.id, content, uploadedAttachments);
        } catch (error) {
            toast.error("Mesaj gönderilemedi");
        }
    };

    const filteredMessages = useMemo(() => {
        if (!searchQuery) return messages;
        return messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [messages, searchQuery]);

    const renderMessages = () => {
        if (filteredMessages.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center p-8 text-center h-full text-muted-foreground">
                    <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                        <Hash className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">#{channel.name}</h3>
                    <p className="max-w-sm mt-2 text-sm">
                        Bu kanalın başlangıcı. İlk mesajı siz gönderin!
                    </p>
                </div>
            );
        }

        let lastDate: string | null = null;

        return (
            <div className="flex flex-col gap-0.5 pb-4">
                {filteredMessages.map((msg, index) => {
                    const msgDate = format(new Date(msg.created_at), 'd MMMM yyyy', { locale: tr });
                    const showDateDivider = msgDate !== lastDate;
                    lastDate = msgDate;

                    const prevMsg = filteredMessages[index - 1];
                    const isContinuous = !showDateDivider && prevMsg &&
                        prevMsg.user_id === msg.user_id &&
                        (new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() < 5 * 60 * 1000);

                    return (
                        <div key={msg.id}>
                            {showDateDivider && (
                                <div className="relative flex items-center justify-center my-6">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-border/60"></div>
                                    </div>
                                    <div className="relative bg-white px-4 text-xs font-medium text-muted-foreground rounded-full border border-border/40 py-0.5 shadow-sm">
                                        {msgDate}
                                    </div>
                                </div>
                            )}
                            <ChatMessage message={msg} isContinuous={!!isContinuous} currentUser={user} />
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>
        );
    };

    const isAdmin = user.role === 'admin' || user.role === 'instructor';

    // Categorize members
    const instructors = allMembers.filter(m => m.role === 'admin' || m.role === 'instructor');
    const membersList = allMembers.filter(m => m.role === 'member');

    return (
        <div className="flex h-full bg-white overflow-hidden relative">
            <SpaceSettingsDialog
                open={isSettingsOpen}
                onOpenChange={setIsSettingsOpen}
                channel={channel}
                members={members}
                isAdmin={isAdmin}
            />

            {/* Main Chat Feed */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="h-14 border-b flex items-center justify-between px-4 flex-shrink-0 bg-white/80 backdrop-blur-sm z-10 sticky top-0">
                    <div className="flex items-center gap-2 min-w-0">
                        <Hash className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                                <h1 className="font-bold text-sm sm:text-base truncate flex items-center gap-2">
                                    {channel.name}
                                </h1>
                                {channel.access_level === 'secret' && <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] rounded-full uppercase">Gizli</span>}
                                {channel.access_level === 'private' && <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] rounded-full uppercase">Özel</span>}
                            </div>
                            {channel.description && (
                                <p className="text-xs text-muted-foreground truncate hidden sm:block">
                                    {channel.description}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-4">
                        <div className="hidden md:flex items-center border rounded-md px-2 py-1 h-8 bg-muted/20 focus-within:bg-transparent focus-within:ring-2 ring-ring transition-all w-48 lg:w-64">
                            <Search className="w-4 h-4 text-muted-foreground mr-2" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Ara..."
                                className="bg-transparent border-none outline-none text-sm w-full placeholder:text-muted-foreground/70 h-full"
                            />
                        </div>

                        <div className="flex items-center gap-1 border-l pl-2 sm:pl-4 ml-2">
                            {isAdmin && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" title="Daha fazla">
                                            <MoreVertical className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuItem className="cursor-pointer" onClick={() => setIsSettingsOpen(true)}>
                                            <Settings className="w-4 h-4 mr-2" />
                                            <span>Alan Ayarları</span>
                                        </DropdownMenuItem>
                                        <Separator className="my-1" />
                                        <DropdownMenuItem
                                            className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                                            onClick={() => setIsDeleteModalOpen(true)}
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            <span>Alanı Sil</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}

                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" title="Bildirimler">
                                <Bell className="w-4 h-4" />
                            </Button>

                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-8 w-8 text-muted-foreground", isSidebarOpen && "bg-muted text-foreground")}
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                title={isSidebarOpen ? 'Üyeleri Gizle' : 'Üyeleri Göster'}
                            >
                                <Users className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </header>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto min-h-0 bg-white relative scroll-smooth">
                    <div className="px-4 py-6 min-h-full flex flex-col justify-end">
                        {renderMessages()}
                    </div>
                </div>

                {/* Input Area */}
                <div className="flex-shrink-0 px-4 pb-4 bg-white pt-2">
                    <ChatInput onSend={handleSendMessage} />
                </div>

                <DeleteSpaceDialog
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    channelId={channel.id}
                    channelName={channel.name}
                />
            </div>

            {/* Right Sidebar - Members */}
            {isSidebarOpen && (
                <div className="w-64 border-l bg-gray-50/50 flex flex-col flex-shrink-0 hidden md:flex">
                    <div className="h-14 flex items-center px-4 border-b font-semibold text-sm text-muted-foreground flex-shrink-0">
                        Üyeler {(isAdmin || !channel.settings?.hide_member_count) && `(${allMembers.length})`}
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <div className="p-3 space-y-4">
                            {/* Group 1: Eğitmenler / Admins */}
                            <div className="space-y-1">
                                <h4 className="px-2 text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Eğitmenler {(isAdmin || !channel.settings?.hide_member_count) && `— ${instructors.length}`}</h4>
                                {instructors.map(m => (
                                    <MemberItem
                                        key={m.id}
                                        member={m}
                                        isSelf={m.id === user.id}
                                        isOnline={onlineUserIds.has(m.id)}
                                    />
                                ))}
                                {instructors.length === 0 && (
                                    <div className="px-2 text-xs text-muted-foreground italic">Çevrimdışı</div>
                                )}
                            </div>

                            {/* Group 2: Üyeler */}
                            <div className="space-y-1 pt-2">
                                <h4 className="px-2 text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
                                    Çevrimiçi {(isAdmin || !channel.settings?.hide_member_count) && `— ${Array.from(onlineUserIds).filter(id => membersList.some(m => m.id === id)).length}`}
                                </h4>
                                {membersList.map(m => (
                                    <MemberItem
                                        key={m.id}
                                        member={m}
                                        isSelf={m.id === user.id}
                                        isOnline={onlineUserIds.has(m.id)}
                                    />
                                ))}
                                {membersList.length === 0 && (
                                    <div className="px-2 italic text-xs text-muted-foreground text-center py-2">Henüz başka üye yok</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function MemberItem({ member, isSelf, isOnline }: { member: Profile, isSelf?: boolean, isOnline?: boolean }) {
    return (
        <button className="flex items-center gap-2 w-full px-2 py-1.5 hover:bg-gray-200/50 rounded-md transition-colors text-left group">
            <div className="relative">
                <Avatar className="w-8 h-8">
                    <AvatarImage src={member.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.id}`} />
                    <AvatarFallback>{member.full_name?.charAt(0)}</AvatarFallback>
                </Avatar>
                {/* Online Indicator */}
                {isOnline && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
                )}
                {!isOnline && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-gray-300 border-2 border-white rounded-full"></div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className={cn("text-sm font-medium truncate group-hover:text-gray-900", isOnline ? "text-gray-700" : "text-gray-400")}>
                    {member.full_name} {isSelf && "(Sen)"}
                </div>
                {member.role !== 'member' && (
                    <div className="text-[10px] text-blue-600/70 font-semibold uppercase">{member.role === 'instructor' ? 'Eğitmen' : 'Yönetici'}</div>
                )}
            </div>
        </button>
    )
}
