"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Image as ImageIcon, X, Loader2, Maximize2, Minimize2,
    Paperclip, Hash, Video, Smile, Mic, BarChart2, MoreHorizontal,
    ChevronDown
} from "lucide-react";
import { createPost } from "@/actions/community";
import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CreatePostProps {
    user: any;
    channelId?: string;
    communityId?: string;
    children?: React.ReactNode; // Custom trigger
}

export function CreatePost({ user, channelId, communityId, children }: CreatePostProps) {
    const [open, setOpen] = useState(false);
    const [content, setContent] = useState("");
    const [title, setTitle] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const [isUploading, setIsUploading] = useState(false);
    const [fullScreen, setFullScreen] = useState(false);

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

                await createPost(content, channelId, communityId, title, imageUrl);

                // Reset form
                setContent("");
                setTitle("");
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
                                <ImageIcon className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                )}
            </DialogTrigger>

            <DialogContent className={`p-0 gap-0 overflow-hidden bg-background ${fullScreen ? 'w-screen h-screen max-w-none rounded-none' : 'max-w-3xl sm:rounded-2xl'}`}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <h2 className="text-lg font-semibold">Gönderi oluştur</h2>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setFullScreen(!fullScreen)} className="hidden sm:inline-flex">
                            {fullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex flex-col h-[60vh] sm:h-[500px] overflow-y-auto p-6">
                    <div className="space-y-4 flex-1">
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Başlık (opsiyonel)"
                            className="w-full bg-transparent text-3xl font-bold placeholder:text-muted-foreground/50 outline-none border-none p-0 focus-visible:ring-0"
                            autoFocus
                        />

                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Bir şeyler yaz..."
                            className="w-full flex-1 bg-transparent text-lg placeholder:text-muted-foreground/50 outline-none border-none p-0 resize-none min-h-[200px] focus-visible:ring-0"
                        />

                        {imagePreview && (
                            <div className="relative rounded-lg overflow-hidden border border-border max-w-sm">
                                <img src={imagePreview} alt="Preview" className="w-full h-auto object-cover" />
                                <button
                                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                                    className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Toolbar */}
                <div className="px-6 py-4 border-t border-border bg-muted/10 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                            <label className="cursor-pointer flex items-center justify-center w-full h-full">
                                <ImageIcon className="w-5 h-5" />
                                <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                            </label>
                        </Button>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                            <Paperclip className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                            <Video className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                            <Smile className="w-5 h-5" />
                        </Button>
                        {/* More icons as per design */}
                        <div className="h-4 w-px bg-border mx-2" />
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                            <Mic className="w-5 h-5" />
                        </Button>
                    </div>

                    <div className="flex items-center gap-3">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="text-muted-foreground text-sm font-normal">
                                    Paylaşılacak alan seç
                                    <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem>Genel</DropdownMenuItem>
                                <DropdownMenuItem>Duyurular</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                            onClick={handleSubmit}
                            disabled={isPending || isUploading || (!content.trim() && !imageFile && !title.trim())}
                            className="bg-black text-white hover:bg-gray-800 rounded-full px-6"
                        >
                            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Paylaş"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
