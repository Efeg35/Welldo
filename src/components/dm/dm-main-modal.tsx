"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MessageCircle, Plus, CheckCircle2, Image as ImageIcon, Paperclip, ArrowUp, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getConversations, getOrCreateConversation, sendMessage, uploadFile } from "@/actions/dm";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { Conversation } from "@/types/dm";
import { DirectMessageWindow } from "./dm-window";
import { searchUsers } from "@/actions/community";
import { Profile } from "@/types";
import { toast } from "sonner";

interface DirectMessageMainModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialMode?: 'chat' | 'new';
}

export function DirectMessageMainModal({ open, onOpenChange, initialMode = 'chat' }: DirectMessageMainModalProps) {
    const [mode, setMode] = useState<'chat' | 'new'>(initialMode);
    const [activeTab, setActiveTab] = useState<'inbox' | 'unread'>('inbox');
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // New Message Search State
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Profile[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedRecipient, setSelectedRecipient] = useState<Profile | null>(null);
    const [newMessage, setNewMessage] = useState("");
    const [isSendingFirst, setIsSendingFirst] = useState(false);
    const [attachments, setAttachments] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    // Prevent body scroll when open
    useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [open]);

    const loadConversations = async () => {
        setIsLoading(true);
        try {
            const data = await getConversations();
            setConversations(data);
            if (data.length > 0 && !selectedConversation && mode === 'chat') {
                setSelectedConversation(data[0]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const supabase = createClient();

        // Subscribe to conversation updates
        const channel = supabase
            .channel('conversation_updates')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'conversations' },
                () => {
                    loadConversations();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    useEffect(() => {
        if (open) {
            loadConversations();
            setMode(initialMode);
        }
    }, [open, initialMode]);

    const handleSearch = async (val: string) => {
        setQuery(val);
        if (val.length < 2) {
            setResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const data = await searchUsers(val);
            setResults(data as unknown as Profile[]);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectUser = async (user: Profile) => {
        setSelectedRecipient(user);
        setQuery("");
        setResults([]);
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAttachments(prev => [...prev, { file, type, id: Math.random().toString(36).substring(7) }]);
        e.target.value = '';
    };

    const handleSendFirstMessage = async () => {
        if (!selectedRecipient || (!newMessage.trim() && attachments.length === 0) || isSendingFirst) return;

        setIsSendingFirst(true);
        try {
            const conversationId = await getOrCreateConversation(selectedRecipient.id);

            // Upload all attachments
            const uploadedAttachments = await Promise.all(attachments.map(async (a) => {
                return await uploadFile(a.file, conversationId);
            }));

            await sendMessage(conversationId, newMessage, uploadedAttachments);

            setNewMessage("");
            setAttachments([]);
            setSelectedRecipient(null);
            setMode('chat');

            // Reload and select the conversation
            const data = await getConversations();
            setConversations(data);
            const found = data.find(c => c.id === conversationId);
            if (found) setSelectedConversation(found);
            else loadConversations();
        } catch (error) {
            console.error(error);
            toast.error("Mesaj gönderilemedi");
        } finally {
            setIsSendingFirst(false);
        }
    };

    const filteredConversations = conversations.filter(c => {
        if (activeTab === 'unread') return false;
        return true;
    });

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed inset-0 z-[100] bg-white shadow-2xl flex overflow-hidden"
                >
                    <div className="w-[320px] flex flex-col border-r border-gray-100 bg-white shrink-0">
                        <div className="px-5 py-4 flex items-center justify-between">
                            <h2 className="font-bold text-[17px] text-gray-900 tracking-tight">Mesajlar</h2>
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="w-[18px] h-[18px] text-gray-400 cursor-pointer hover:text-black transition-colors" />
                                <Plus
                                    className="w-[18px] h-[18px] text-gray-400 cursor-pointer hover:text-black transition-colors"
                                    onClick={() => setMode('new')}
                                />
                            </div>
                        </div>

                        <div className="px-5 border-b flex items-center gap-6 mb-2">
                            <button
                                onClick={() => setActiveTab('inbox')}
                                className={cn(
                                    "py-3 text-[14px] font-bold border-b-[2px] transition-colors",
                                    activeTab === 'inbox' ? "border-black text-black" : "border-transparent text-gray-400 hover:text-black"
                                )}
                            >
                                Gelen Kutusu
                            </button>
                            <button
                                onClick={() => setActiveTab('unread')}
                                className={cn(
                                    "py-3 text-[14px] font-bold border-b-[2px] transition-colors",
                                    activeTab === 'unread' ? "border-black text-black" : "border-transparent text-gray-400 hover:text-black"
                                )}
                            >
                                Okunmamış
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-3 pb-3">
                            {isLoading ? (
                                <div className="p-8 text-center text-sm text-gray-400">Yükleniyor...</div>
                            ) : filteredConversations.length > 0 ? (
                                <div className="space-y-0.5">
                                    {filteredConversations.map(conv => (
                                        <button
                                            key={conv.id}
                                            onClick={() => {
                                                setSelectedConversation(conv);
                                                setMode('chat');
                                            }}
                                            className={cn(
                                                "w-full p-2.5 flex items-center gap-3 hover:bg-gray-50 rounded-lg transition-colors text-left group",
                                                selectedConversation?.id === conv.id && mode === 'chat' ? "bg-gray-100" : ""
                                            )}
                                        >
                                            <Avatar className="h-10 w-10 border border-gray-100">
                                                <AvatarImage src={conv.other_participant?.avatar_url || undefined} />
                                                <AvatarFallback>{conv.other_participant?.full_name?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <span className="font-bold text-[14px] truncate text-gray-900">{conv.other_participant?.full_name}</span>
                                                    <span className="text-[11px] text-gray-400 font-medium">
                                                        {conv.last_message && formatDistanceToNow(new Date(conv.last_message.created_at), { addSuffix: false, locale: tr })}
                                                    </span>
                                                </div>
                                                <p className={cn(
                                                    "text-[13px] truncate line-clamp-1",
                                                    selectedConversation?.id === conv.id ? "text-gray-600" : "text-gray-500 group-hover:text-gray-600"
                                                )}>
                                                    {conv.last_message?.content || "Henüz mesaj yok"}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-gray-400">
                                    <p className="text-sm font-medium">Mesaj yok</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col bg-white relative before:absolute before:left-0 before:top-0 before:bottom-0 before:w-px before:bg-gray-100">
                        <button
                            onClick={() => onOpenChange(false)}
                            className="absolute top-4 right-4 z-30 p-2 rounded-full hover:bg-gray-100 transition-colors group"
                        >
                            <X className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition-colors" />
                        </button>

                        {mode === 'new' ? (
                            <div className="flex-1 flex flex-col h-full w-full">
                                <div className="px-8 pt-6 pb-4 border-b border-gray-50">
                                    <h3 className="font-bold text-lg mb-6 text-gray-900 tracking-tight">Yeni mesaj</h3>
                                    <div className="flex items-center gap-3 text-sm pb-2">
                                        <span className="text-gray-900 font-bold shrink-0">Kime:</span>
                                        {selectedRecipient ? (
                                            <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full group">
                                                <Avatar className="h-5 w-5">
                                                    <AvatarImage src={selectedRecipient.avatar_url || ""} />
                                                    <AvatarFallback>{selectedRecipient.full_name?.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <span className="text-[13px] font-medium text-gray-900">{selectedRecipient.full_name}</span>
                                                <X
                                                    className="w-3 h-3 text-gray-400 hover:text-black cursor-pointer"
                                                    onClick={() => setSelectedRecipient(null)}
                                                />
                                            </div>
                                        ) : (
                                            <input
                                                autoFocus
                                                placeholder="İsim yazmaya başlayın"
                                                className="flex-1 bg-transparent border-none focus:ring-0 outline-none p-0 text-gray-900 placeholder-gray-400 font-normal"
                                                value={query}
                                                onChange={(e) => handleSearch(e.target.value)}
                                            />
                                        )}
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto px-8">
                                    {isSearching ? (
                                        <div className="p-8 flex justify-center">
                                            <Loader2 className="w-6 h-6 animate-spin text-gray-200" />
                                        </div>
                                    ) : results.length > 0 ? (
                                        <div className="py-2">
                                            {results.map(user => (
                                                <button
                                                    key={user.id}
                                                    onClick={() => handleSelectUser(user)}
                                                    className="w-full py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 group"
                                                >
                                                    <Avatar className="h-10 w-10 border border-gray-100">
                                                        <AvatarImage src={user.avatar_url || ""} />
                                                        <AvatarFallback>{user.full_name?.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-gray-900 group-hover:text-black">{user.full_name}</span>
                                                        <span className="text-xs text-gray-400 group-hover:text-gray-500">{user.email}</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    ) : query.length >= 2 ? (
                                        <div className="p-8 text-center text-gray-300 text-sm">Üye bulunamadı</div>
                                    ) : null}
                                </div>

                                {/* Message Input at bottom */}
                                <div className="p-8 pb-8 pt-2">
                                    {attachments.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {attachments.map((a) => (
                                                <div key={a.id} className="relative group bg-gray-50 rounded-lg p-2 flex items-center gap-2 border border-gray-100">
                                                    {a.type === 'image' ? (
                                                        <ImageIcon className="w-4 h-4 text-gray-400" />
                                                    ) : (
                                                        <Paperclip className="w-4 h-4 text-gray-400" />
                                                    )}
                                                    <span className="text-xs text-gray-600 max-w-[150px] truncate">{a.file.name}</span>
                                                    <button
                                                        onClick={() => setAttachments(prev => prev.filter(att => att.id !== a.id))}
                                                        className="absolute -top-1 -right-1 bg-white rounded-full shadow-sm p-0.5 opacity-0 group-hover:opacity-100 transition-opacity border border-gray-100"
                                                    >
                                                        <X className="w-3 h-3 text-gray-400 hover:text-red-500" />
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
                                            disabled={!selectedRecipient}
                                            className="w-full bg-transparent border-none focus:ring-0 text-gray-900 placeholder-gray-400 p-0 text-[15px] resize-none leading-relaxed min-h-[40px]"
                                            placeholder="Mesaj yazın..."
                                            rows={1}
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendFirstMessage();
                                                }
                                            }}
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
                                            <div
                                                className={cn(
                                                    "h-8 w-8 rounded-full flex items-center justify-center transition-all",
                                                    (newMessage.trim() || attachments.length > 0) && selectedRecipient
                                                        ? "bg-black text-white shadow-md transform hover:scale-105 cursor-pointer"
                                                        : "bg-gray-100 text-gray-300 cursor-not-allowed"
                                                )}
                                                onClick={handleSendFirstMessage}
                                            >
                                                {isSendingFirst ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <ArrowUp className="w-4 h-4" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : selectedConversation ? (
                            <div className="flex-1 flex flex-col h-full overflow-hidden">
                                <DirectMessageWindow
                                    conversationId={selectedConversation.id}
                                    otherUser={selectedConversation.other_participant}
                                />
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white">
                                <div className="w-24 h-24 rounded-full bg-gray-50 flex items-center justify-center mb-6">
                                    <MessageCircle className="w-10 h-10 text-gray-200" strokeWidth={1.5} />
                                </div>
                                <h4 className="text-gray-900 font-bold text-xl mb-2 tracking-tight">Sohbet seçilmedi</h4>
                                <p className="max-w-xs text-sm text-gray-500 leading-relaxed mb-8">Sohbet etmek için soldaki listeden bir konuşma seçin veya yeni bir mesaj oluşturun.</p>
                                <Button
                                    className="rounded-full bg-black text-white px-8 py-5 text-[15px] font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                                    onClick={() => setMode('new')}
                                >
                                    Mesaj gönder
                                </Button>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
