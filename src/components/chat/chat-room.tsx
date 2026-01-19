"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "lucide-react";
import type { Message, Profile } from "@/types";

interface ChatRoomProps {
    channelId: string;
    channelName: string;
}

interface MessageWithUser extends Message {
    user: Profile;
}

export function ChatRoom({ channelId, channelName }: ChatRoomProps) {
    const supabase = createClient();
    const { user } = useAuth();
    const [messages, setMessages] = useState<MessageWithUser[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Fetch initial messages
    useEffect(() => {
        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from("messages")
                .select(`*, user:profiles(*)`)
                .eq("channel_id", channelId)
                .order("created_at", { ascending: true })
                .limit(50);

            if (!error && data) {
                setMessages(data as MessageWithUser[]);
            }
            setLoading(false);
        };

        fetchMessages();
    }, [channelId, supabase]);

    // Subscribe to realtime messages
    useEffect(() => {
        const channel = supabase
            .channel(`messages:${channelId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter: `channel_id=eq.${channelId}`,
                },
                async (payload) => {
                    // Fetch user data for the new message
                    const { data: userData } = await supabase
                        .from("profiles")
                        .select("*")
                        .eq("id", payload.new.user_id)
                        .single();

                    const newMsg: MessageWithUser = {
                        ...(payload.new as Message),
                        user: userData as Profile,
                    };

                    setMessages((prev) => [...prev, newMsg]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [channelId, supabase]);

    // Auto-scroll on new messages
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Send message
    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;

        setSending(true);
        const { error } = await supabase.from("messages").insert({
            channel_id: channelId,
            user_id: user.id,
            content: newMessage.trim(),
        });

        if (!error) {
            setNewMessage("");
        }
        setSending(false);
    };

    // Format time
    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString("tr-TR", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (loading) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col">
            {/* Chat Header */}
            <div className="border-b border-border bg-background/80 px-4 py-3 backdrop-blur-lg">
                <h2 className="font-semibold">{channelName}</h2>
                <p className="text-xs text-muted-foreground">
                    {messages.length} mesaj
                </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="flex flex-col gap-4">
                    {messages.map((message) => {
                        const isOwn = message.user_id === user?.id;
                        return (
                            <div
                                key={message.id}
                                className={`flex gap-2 ${isOwn ? "flex-row-reverse" : ""}`}
                            >
                                <Avatar className="h-8 w-8 flex-shrink-0">
                                    <AvatarImage
                                        src={message.user?.avatar_url || undefined}
                                        alt={message.user?.full_name || "User"}
                                    />
                                    <AvatarFallback>
                                        {message.user?.full_name?.[0] || "U"}
                                    </AvatarFallback>
                                </Avatar>
                                <div
                                    className={`max-w-[75%] rounded-2xl px-4 py-2 ${isOwn
                                            ? "bg-violet-500 text-white"
                                            : "bg-muted text-foreground"
                                        }`}
                                >
                                    {!isOwn && (
                                        <p className="mb-1 text-xs font-medium opacity-70">
                                            {message.user?.full_name || "Kullanıcı"}
                                        </p>
                                    )}
                                    <p className="text-sm">{message.content}</p>
                                    <p
                                        className={`mt-1 text-right text-[10px] ${isOwn ? "text-white/70" : "text-muted-foreground"
                                            }`}
                                    >
                                        {formatTime(message.created_at)}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Message Input */}
            <form
                onSubmit={handleSend}
                className="border-t border-border bg-background p-4"
            >
                <div className="flex gap-2">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Mesaj yaz..."
                        className="flex-1"
                        disabled={sending}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={sending || !newMessage.trim()}
                        className="bg-violet-500 hover:bg-violet-600"
                    >
                        {sending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
