"use client";

import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Image as ImageIcon,
    Paperclip,
    ChevronLeft,
    ArrowUp,
    Loader2,
    X
} from "lucide-react";
import { getMessages, sendMessage, markAsRead, uploadFile } from "@/actions/dm";
import { DirectMessage } from "@/types/dm";
import { createClient } from "@/lib/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface DirectMessageWindowProps {
    conversationId: string;
    otherUser: any;
    onBack?: () => void;
}

export function DirectMessageWindow({ conversationId, otherUser, onBack }: DirectMessageWindowProps) {
    const [messages, setMessages] = useState<DirectMessage[]>([]);
    const [content, setContent] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [attachments, setAttachments] = useState<any[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    useEffect(() => {
        loadMessages();
        markAsRead(conversationId);

        // Subscribe to new messages
        const channel = supabase
            .channel(`dm:${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'direct_messages',
                    filter: `conversation_id=eq.${conversationId}`
                },
                (payload) => {
                    const newMessage = payload.new as DirectMessage;
                    setMessages(prev => [...prev, newMessage]);
                    scrollToBottom();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversationId]);

    const loadMessages = async () => {
        const data = await getMessages(conversationId);
        setMessages(data);
        scrollToBottom();
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
        }, 100);
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAttachments(prev => [...prev, { file, type, id: Math.random().toString(36).substring(7) }]);
        e.target.value = '';
    };

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if ((!content.trim() && attachments.length === 0) || isSending) return;

        setIsSending(true);
        try {
            // Upload all attachments
            const uploadedAttachments = await Promise.all(attachments.map(async (a) => {
                return await uploadFile(a.file, conversationId);
            }));

            await sendMessage(conversationId, content, uploadedAttachments);
            setContent("");
            setAttachments([]);
            scrollToBottom();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b flex items-center gap-3 bg-white z-10">
                {onBack && (
                    <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                )}
                <Avatar className="h-10 w-10">
                    <AvatarImage src={otherUser?.avatar_url || undefined} />
                    <AvatarFallback>{otherUser?.full_name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                    <span className="font-bold text-base leading-none text-gray-900">{otherUser?.full_name}</span>
                    <span className="text-[11px] text-green-500 font-bold mt-1">Çevrimiçi</span>
                </div>
            </div>

            {/* Messages */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth"
            >
                {messages.map((msg, i) => {
                    const isMe = msg.sender_id !== otherUser?.id;
                    const showAvatar = i === 0 || messages[i - 1].sender_id !== msg.sender_id;

                    return (
                        <div key={msg.id} className={cn(
                            "flex items-start gap-4",
                            isMe ? "flex-row-reverse" : "flex-row"
                        )}>
                            {!isMe && (
                                <div className="w-10 shrink-0">
                                    {showAvatar && (
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={otherUser?.avatar_url || undefined} />
                                            <AvatarFallback>{otherUser?.full_name?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                    )}
                                </div>
                            )}
                            <div className={cn(
                                "max-w-[75%] space-y-1.5",
                                isMe ? "items-end" : "items-start"
                            )}>
                                <div className={cn(
                                    "p-4 rounded-[20px] text-[15px] shadow-sm leading-relaxed",
                                    isMe
                                        ? "bg-gray-900 text-white rounded-tr-none"
                                        : "bg-[#F3F4F6] text-gray-900 rounded-tl-none border border-gray-100"
                                )}>
                                    {msg.content}
                                </div>
                                <span className="text-[10px] text-gray-400 px-1 font-medium">
                                    {format(new Date(msg.created_at), "HH:mm")}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Input Area */}
            <div className="p-8 pb-8 pt-2">
                {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3 px-1">
                        {attachments.map((a) => (
                            <div key={a.id} className="relative group bg-gray-50 rounded-lg p-2.5 flex items-center gap-2.5 border border-gray-100 shadow-sm animate-in zoom-in-95 duration-200">
                                {a.type === 'image' ? (
                                    <ImageIcon className="w-4 h-4 text-emerald-500" />
                                ) : (
                                    <Paperclip className="w-4 h-4 text-blue-500" />
                                )}
                                <span className="text-xs font-medium text-gray-700 max-w-[150px] truncate">{a.file.name}</span>
                                <button
                                    onClick={() => setAttachments(prev => prev.filter(att => att.id !== a.id))}
                                    className="absolute -top-1.5 -right-1.5 bg-white rounded-full shadow-md p-0.5 opacity-0 group-hover:opacity-100 transition-opacity border border-gray-100"
                                >
                                    <X className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="bg-white rounded-2xl border border-gray-200 p-3 min-h-[50px] flex flex-col focus-within:ring-1 focus-within:ring-gray-200 focus-within:border-gray-400 transition-all duration-200">
                    <input
                        type="file"
                        ref={imageInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleFileSelect(e, 'image')}
                    />
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={(e) => handleFileSelect(e, 'file')}
                    />

                    <textarea
                        className="w-full bg-transparent border-none focus:ring-0 text-gray-900 placeholder-gray-400 p-0 text-[15px] resize-none leading-relaxed min-h-[40px]"
                        placeholder="Bir mesaj yazın..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        rows={1}
                    />
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-transparent">
                        <div className="flex items-center gap-4 opacity-50 hover:opacity-100 transition-opacity">
                            <ImageIcon
                                className="w-5 h-5 cursor-pointer text-gray-500 hover:text-black transition-colors"
                                onClick={() => imageInputRef.current?.click()}
                            />
                            <Paperclip
                                className="w-5 h-5 cursor-pointer text-gray-500 hover:text-black transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                            />
                        </div>
                        <button
                            onClick={() => handleSend()}
                            disabled={(!content.trim() && attachments.length === 0) || isSending}
                            className={cn(
                                "h-8 w-8 rounded-full flex items-center justify-center transition-all",
                                (content.trim() || attachments.length > 0) ? "bg-black text-white shadow-md transform hover:scale-105 cursor-pointer" : "bg-gray-100 text-gray-300 cursor-not-allowed"
                            )}
                        >
                            {isSending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <ArrowUp className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
