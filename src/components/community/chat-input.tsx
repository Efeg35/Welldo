"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Image, Smile, Paperclip, Mic, SendHorizontal, AtSign, Hash, Gift } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ChatInputProps {
    onSend: (content: string, attachments: any[]) => Promise<void>;
    disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
    const [content, setContent] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [attachments, setAttachments] = useState<any[]>([]);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [content]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleSend = async () => {
        if ((!content.trim() && attachments.length === 0) || isSending) return;

        setIsSending(true);
        try {
            await onSend(content, attachments);
            setContent("");
            setAttachments([]);
            // Reset height
            if (textareaRef.current) {
                textareaRef.current.style.height = "auto";
            }
        } catch (error) {
            toast.error("Mesaj gönderilemedi");
        } finally {
            setIsSending(false);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Simple client-side object for now, upload happens in parent
        setAttachments(prev => [...prev, { file, type, id: Math.random().toString(36).substring(7) }]);
        e.target.value = '';
    };

    return (
        <div className="p-4 bg-white border-t border-border">
            <div className="relative bg-gray-50 border border-input rounded-xl focus-within:ring-1 focus-within:ring-ring focus-within:border-primary transition-all">
                <Textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Bir mesaj yaz..."
                    disabled={disabled || isSending}
                    className="min-h-[44px] max-h-[200px] w-full resize-none bg-transparent border-0 focus-visible:ring-0 px-4 py-3 placeholder:text-muted-foreground/70"
                    rows={1}
                />

                {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 px-4 pb-2">
                        {attachments.map((a) => (
                            <div key={a.id} className="relative group bg-gray-100 rounded-lg p-2 flex items-center gap-2 border border-gray-200">
                                {a.type === 'image' ? (
                                    <Image className="w-4 h-4 text-emerald-500" />
                                ) : (
                                    <Paperclip className="w-4 h-4 text-blue-500" />
                                )}
                                <span className="text-xs font-medium text-gray-700 max-w-[150px] truncate">{a.file.name}</span>
                                <button
                                    onClick={() => setAttachments(prev => prev.filter(att => att.id !== a.id))}
                                    className="ml-1 text-gray-500 hover:text-red-500"
                                >
                                    &times;
                                </button>
                            </div>
                        ))}
                    </div>
                )}


                <div className="flex items-center justify-between px-2 pb-2 mt-1">
                    <div className="flex items-center gap-0.5">
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

                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-gray-200/50 rounded-full"
                            title="Görsel ekle"
                            onClick={() => imageInputRef.current?.click()}
                        >
                            <Image className="w-5 h-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-gray-200/50 rounded-full"
                            title="Dosya ekle"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Paperclip className="w-5 h-5" />
                        </Button>
                    </div>

                    <div className="flex items-center">
                        <Button
                            onClick={handleSend}
                            disabled={(!content.trim() && attachments.length === 0) || disabled || isSending}
                            size="icon"
                            variant="ghost"
                            className={cn(
                                "h-8 w-8 rounded-full transition-all",
                                (content.trim() || attachments.length > 0) ? "bg-blue-600 text-white hover:bg-blue-700 hover:text-white" : "text-muted-foreground hover:bg-gray-200/50"
                            )}
                        >
                            {isSending ? (
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <SendHorizontal className="w-5 h-5" />
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="text-xs text-muted-foreground mt-2 px-1 hidden sm:block">
                <strong>Enter</strong> ile gönder, <strong>Shift + Enter</strong> ile satır atla
            </div>
        </div>
    );
}
