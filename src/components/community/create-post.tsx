"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Image as ImageIcon, X, Loader2, Maximize2, Minimize2,
    Paperclip, Youtube, Plus, Link, ChevronDown,
    Heading1, Heading2, List, Quote, Minus, Code, Type, Video, Smile
} from "lucide-react";
import { createPost, editPost } from "@/actions/community";
import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Post, Channel } from "@/types";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface CreatePostProps {
    user: any;
    channelId?: string;
    communityId?: string;
    post?: Post;
    channels?: Channel[]; // Available channels for selection
    children?: React.ReactNode; // Custom trigger
    availableTopics?: string[];
    allowTitle?: boolean;
    allowImage?: boolean;
}

export function CreatePost({
    user,
    channelId,
    communityId,
    post,
    channels = [],
    children,
    availableTopics = [],
    allowTitle = true,
    allowImage = true
}: CreatePostProps) {
    const [open, setOpen] = useState(false);
    const [content, setContent] = useState(post?.content || "");
    const [title, setTitle] = useState(post?.title || "");
    const [topic, setTopic] = useState<string | null>(post?.topic || null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(post?.image_url || null);

    // Filter channels to only include 'post' type channels (and 'course' if they allow general posting, but usually just 'post' for now)
    // The user specifically asked for "only post areas".
    const postableChannels = channels.filter(c => c.type === 'post');

    // Channel selection logic
    // If channelId prop is passed (e.g. from a specific Space page), use it.
    // Otherwise, try to find "General" or default to the first available channel.
    const [selectedChannelId, setSelectedChannelId] = useState<string>(
        post?.channel_id || channelId || postableChannels.find(c => c.name === "General")?.id || postableChannels[0]?.id || ""
    );

    const [isPending, startTransition] = useTransition();
    const [isUploading, setIsUploading] = useState(false);
    const [fullScreen, setFullScreen] = useState(false);
    const [showYoutubeInput, setShowYoutubeInput] = useState(false);
    const [youtubeLink, setYoutubeLink] = useState("");

    const handleAddYoutubeLink = () => {
        if (!youtubeLink) {
            setShowYoutubeInput(false);
            return;
        }
        // Append link to content
        insertTextAtCursor(content ? `\n\n${youtubeLink}\n` : youtubeLink);
        setYoutubeLink("");
        setShowYoutubeInput(false);
    };

    const insertTextAtCursor = (textToInsert: string) => {
        // Simple append for MVP if textarea ref is complex, but let's try to append nicely.
        // Actually, without a ref to the textarea, we can only append or prepend via state.
        // For MVP, appending is safer than replacing all content and losing cursor or guessing position blindly.
        // The user experience "adding block" usually appends to end or inserts at cursor. 
        // Let's rely on append for now as it's robust without a Ref. 
        // Wait, refined UX:
        // Use document.getElementById or a ref if possible. But given the component structure,
        // let's stick to appending with a newline separator if needed.

        setContent(prev => {
            const separator = prev.length > 0 && !prev.endsWith('\n') ? '\n' : '';
            return prev + separator + textToInsert;
        });

        // Focus back to textarea? (Ideally yes, but simple state update works).
    };

    const handleFormatting = (type: 'h1' | 'h2' | 'list' | 'quote' | 'divider') => {
        switch (type) {
            case 'h1':
                insertTextAtCursor('# ');
                break;
            case 'h2':
                insertTextAtCursor('## ');
                break;
            case 'list':
                insertTextAtCursor('- ');
                break;
            case 'quote':
                insertTextAtCursor('> ');
                break;
            case 'divider':
                insertTextAtCursor('---\n');
                break;
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async () => {
        if (!content.trim() && !imageFile && !title.trim()) return;

        setIsUploading(true);
        startTransition(async () => {
            try {
                // Use selectedChannelId. Logic:
                // 1. If user selected something explicitly, use that.
                // 2. If nothing selected but we had a default (channelId prop), that was the initial state of selectedChannelId, so it is used.
                // 3. So targetChannelId IS selectedChannelId.
                const targetChannelId = selectedChannelId;

                if (post) {
                    await editPost(post.id, title, content, topic);
                    toast.success("Gönderi güncellendi!");
                } else {
                    let imageUrl = undefined;

                    if (imageFile) {
                        const supabase = createClient();
                        const fileExt = imageFile.name.split('.').pop();
                        const fileName = `${Math.random()}.${fileExt}`;
                        const filePath = `${user.id}/${fileName}`;

                        const { error: uploadError } = await supabase.storage
                            .from('post_images')
                            .upload(filePath, imageFile);

                        if (uploadError) throw uploadError;

                        const { data: { publicUrl } } = supabase.storage
                            .from('post_images')
                            .getPublicUrl(filePath);

                        imageUrl = publicUrl;
                    }

                    await createPost(content, targetChannelId, communityId, title, imageUrl, topic || undefined);
                    toast.success("Gönderi paylaşıldı!");
                }

                // Reset form
                setContent("");
                setTitle("");
                setTopic(null);
                setImageFile(null);
                setImagePreview(null);
                setOpen(false);
                toast.success("Gönderi paylaşıldı!");

            } catch (error) {
                console.error("Failed to create post", error);
                toast.error("Paylaşım yapılamadı");
            } finally {
                setIsUploading(false);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <div className="bg-card border border-border rounded-xl p-4 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer group">
                        <div className="flex gap-4 items-center">
                            <Avatar className="w-10 h-10">
                                <AvatarImage src={user ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}` : undefined} />
                                <AvatarFallback>U</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 bg-muted/50 rounded-full h-10 px-4 flex items-center text-muted-foreground group-hover:bg-muted transition-colors">
                                Toplulukla bir şeyler paylaş...
                            </div>
                            <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-foreground">
                                <Plus className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                )}
            </DialogTrigger>

            <DialogContent className={`p-0 gap-0 overflow-hidden bg-background shadow-2xl ${fullScreen ? 'w-screen h-screen max-w-none rounded-none' : 'w-full sm:max-w-[850px] sm:rounded-xl'}`}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4">
                    <DialogTitle className="text-xl font-bold">{post ? 'Gönderiyi Düzenle' : 'Gönderi Oluştur'}</DialogTitle>
                </div>

                {/* Body */}
                <div className="flex flex-col h-[60vh] sm:h-[450px] overflow-y-auto px-8 py-2">
                    <div className="space-y-4 flex-1">
                        {allowTitle && (
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Başlık (isteğe bağlı)"
                                className="w-full bg-transparent text-4xl font-bold placeholder:text-muted-foreground/40 outline-none border-none p-0 focus-visible:ring-0"
                                autoFocus
                            />
                        )}

                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Bir şeyler yaz..."
                            className="w-full flex-1 bg-transparent text-lg placeholder:text-muted-foreground/40 outline-none border-none p-0 resize-none min-h-[200px] focus-visible:ring-0"
                        />

                        {imagePreview && (
                            <div className="relative rounded-lg overflow-hidden border border-border max-w-sm mt-4">
                                <img src={imagePreview} alt="Preview" className="w-full h-auto object-cover" />
                                <button
                                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                                    className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Toolbar */}
                <div className="px-6 py-4 flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-1 text-muted-foreground">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="hover:bg-muted/50 hover:text-foreground relative group">
                                    <div className="rounded-full border border-muted-foreground/30 p-1 group-hover:border-primary group-hover:text-primary transition-colors">
                                        <Plus className="w-4 h-4" />
                                    </div>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-56 p-2" side="top">
                                <div className="text-xs font-semibold text-muted-foreground px-2 py-1 mb-1 uppercase tracking-wider">Temel Formatlama</div>
                                <DropdownMenuItem onClick={() => handleFormatting('h1')} className="cursor-pointer gap-2">
                                    <Heading1 className="w-4 h-4" />
                                    <span>Başlık 1</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleFormatting('h2')} className="cursor-pointer gap-2">
                                    <Heading2 className="w-4 h-4" />
                                    <span>Başlık 2</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleFormatting('list')} className="cursor-pointer gap-2">
                                    <List className="w-4 h-4" />
                                    <span>Liste</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleFormatting('quote')} className="cursor-pointer gap-2">
                                    <Quote className="w-4 h-4" />
                                    <span>Alıntı</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleFormatting('divider')} className="cursor-pointer gap-2">
                                    <Minus className="w-4 h-4" />
                                    <span>Ayırıcı</span>
                                </DropdownMenuItem>

                                <div className="h-px bg-border my-2" />

                                <div className="text-xs font-semibold text-muted-foreground px-2 py-1 mb-1 uppercase tracking-wider">Medya</div>
                                {allowImage && (
                                    <DropdownMenuItem className="cursor-pointer gap-2 relative">
                                        <ImageIcon className="w-4 h-4" />
                                        <span>Resim</span>
                                        <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageSelect} />
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem className="cursor-pointer gap-2 relative">
                                    <Paperclip className="w-4 h-4" />
                                    <span>Dosya</span>
                                    <input type="file" accept="image/*,application/pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageSelect} />
                                </DropdownMenuItem>

                                <div className="h-px bg-border my-2" />

                                <div className="text-xs font-semibold text-muted-foreground px-2 py-1 mb-1 uppercase tracking-wider">Embed</div>
                                <DropdownMenuItem onClick={() => setShowYoutubeInput(true)} className="cursor-pointer gap-2">
                                    <Link className="w-4 h-4" />
                                    <span>Video / Embed</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {allowImage && (
                            <Button variant="ghost" size="icon" className="hover:bg-muted/50 hover:text-foreground relative overflow-hidden">
                                <label className="cursor-pointer flex items-center justify-center w-full h-full absolute inset-0">
                                    <ImageIcon className="w-5 h-5" />
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                                </label>
                            </Button>
                        )}
                        <Button variant="ghost" size="icon" className="hover:bg-muted/50 hover:text-foreground relative overflow-hidden">
                            <label className="cursor-pointer flex items-center justify-center w-full h-full absolute inset-0">
                                <Paperclip className="w-5 h-5" />
                                <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleImageSelect} />
                            </label>
                        </Button>

                        <Popover open={showYoutubeInput} onOpenChange={setShowYoutubeInput}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn("hover:bg-muted/50 hover:text-foreground", showYoutubeInput && "bg-muted text-foreground")}
                                >
                                    <Youtube className="w-5 h-5" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-4" side="top" align="start">
                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-medium leading-none">Video Ekle</h4>
                                        <p className="text-sm text-muted-foreground">Video (YouTube, Vimeo vb.) linkini buraya yapıştırın.</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Input
                                            autoFocus
                                            placeholder="https://youtube.com/..."
                                            value={youtubeLink}
                                            onChange={(e) => setYoutubeLink(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleAddYoutubeLink();
                                            }}
                                            className="h-8"
                                        />
                                        <Button
                                            size="sm"
                                            onClick={handleAddYoutubeLink}
                                            disabled={!youtubeLink}
                                            className="h-8 bg-zinc-900 text-white hover:bg-zinc-800"
                                        >
                                            Ekle
                                        </Button>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Topic Selector */}
                        {availableTopics.length > 0 && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="text-muted-foreground hover:text-foreground text-sm font-normal px-2 h-auto gap-2 max-w-[200px]">
                                        <span className="truncate">
                                            {topic || "Bir konu seç"}
                                        </span>
                                        <ChevronDown className="w-3 h-3 opacity-50 shrink-0" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[200px] max-h-[300px] overflow-y-auto">
                                    <DropdownMenuItem onSelect={() => setTopic(null)}>
                                        <span className="text-muted-foreground italic">Konu yok</span>
                                    </DropdownMenuItem>
                                    {availableTopics.map(t => (
                                        <DropdownMenuItem
                                            key={t}
                                            onSelect={() => setTopic(t)}
                                            className="justify-between"
                                        >
                                            <span className="truncate">{t}</span>
                                            {topic === t && <Check className="w-4 h-4 opacity-50" />}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}

                        {/* Space Selector - Only show if not forced to a specific channel (or if we want to allow moving)
                            But usually if channelId is passed, we are LOCKED to that channel context.
                            If channelId is NOT passed (Dashboard), we show selector.
                         */}
                        {/* Space Selector - Always show if we have channels to choose from. */}
                        {postableChannels.length > 0 && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="text-muted-foreground hover:text-foreground text-sm font-normal px-2 h-auto gap-2 max-w-[200px]">
                                        <span className="truncate">
                                            {postableChannels.find(c => c.id === selectedChannelId)?.name || "Bir alan seç"}
                                        </span>
                                        <ChevronDown className="w-3 h-3 opacity-50 shrink-0" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[200px] max-h-[300px] overflow-y-auto">
                                    {postableChannels.map(channel => (
                                        <DropdownMenuItem
                                            key={channel.id}
                                            onSelect={() => setSelectedChannelId(channel.id)}
                                            className="justify-between"
                                        >
                                            <span className="truncate">{channel.name}</span>
                                            {selectedChannelId === channel.id && <Check className="w-4 h-4 opacity-50" />}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                        {/* Show fallback text only if no channels available to select (should be rare) */}
                        {postableChannels.length === 0 && channelId && (
                            <div className="text-xs text-muted-foreground px-2 flex items-center gap-1">
                                <span className="opacity-70">Şurada paylaşılıyor:</span>
                                <span className="font-medium text-foreground">
                                    {channels.find(c => c.id === channelId)?.name || "Bu Alan"}
                                </span>
                            </div>
                        )}

                        <Button
                            onClick={handleSubmit}
                            disabled={isPending || isUploading || (!content.trim() && !imageFile && !title.trim())}
                            className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-full px-6 py-2 font-medium"
                        >
                            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : (post ? "Güncelle" : "Paylaş")}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
