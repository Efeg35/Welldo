"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, ArrowRight, Paperclip, Image as ImageIcon, Smile } from "lucide-react";
import { useState, useTransition, useEffect, useRef } from "react";
import { sendMessage } from "@/actions/chat";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface ChatThreadProps {
    conversationId: string;
    messages: any[];
    otherUser: any;
    currentUser: any;
}

export function ChatThread({ conversationId, messages, otherUser, currentUser }: ChatThreadProps) {
    const [input, setInput] = useState("");
    const [isPending, startTransition] = useTransition();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        startTransition(async () => {
            await sendMessage(conversationId, input);
            setInput("");
        });
    };

    return (
        <div className="flex-1 flex flex-col bg-background h-full">
            {/* Thread Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="font-semibold">{otherUser?.full_name || 'Sohbet'}</span>
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                {messages.map((msg, index) => {
                    const isMe = msg.sender_id === currentUser?.id;
                    return (
                        <div key={msg.id || index} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                            <Avatar className="w-8 h-8 mt-1">
                                <AvatarImage src={isMe ? currentUser?.user_metadata?.avatar_url : otherUser?.avatar_url} />
                                <AvatarFallback>{isMe ? 'S' : otherUser?.full_name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className={`flex-1 max-w-[70%] ${isMe ? 'text-right' : ''}`}>
                                <div className={`flex items-center gap-2 ${isMe ? 'justify-end' : ''}`}>
                                    <span className="font-medium text-sm">{isMe ? 'Sen' : msg.profiles?.full_name}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {msg.created_at ? format(new Date(msg.created_at), 'HH:mm', { locale: tr }) : ''}
                                    </span>
                                </div>
                                <div className={`inline-block text-sm mt-1 p-3 rounded-lg text-left ${isMe ? 'bg-[#408FED] text-white rounded-br-none' : 'bg-muted rounded-bl-none'}`}>
                                    {msg.content}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-border">
                <div className="flex items-center gap-2 bg-muted/50 rounded-xl p-3">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Mesaj gönder..."
                        className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Paperclip className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Smile className="w-4 h-4" />
                        </Button>
                    </div>
                    <Button
                        size="icon"
                        onClick={handleSend}
                        disabled={isPending || !input.trim()}
                        className="rounded-full bg-[#408FED] hover:bg-[#408FED]/90"
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
