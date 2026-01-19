"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Image as ImageIcon, X, Loader2, Maximize2, Minimize2,
    Paperclip, Hash, Video, Smile, Mic, BarChart2, MoreHorizontal,
    ChevronDown, Plus
} from "lucide-react";
import { createPost } from "@/actions/community";
import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
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

            <DialogContent className={`p-0 gap-0 overflow-hidden bg-background shadow-2xl ${fullScreen ? 'w-screen h-screen max-w-none rounded-none' : 'w-full sm:max-w-[850px] sm:rounded-xl'}`}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4">
                    <DialogTitle className="text-xl font-bold">Create post</DialogTitle>
                </div>

                {/* Body */}
                <div className="flex flex-col h-[60vh] sm:h-[450px] overflow-y-auto px-8 py-2">
                    <div className="space-y-4 flex-1">
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Title (optional)"
                            className="w-full bg-transparent text-4xl font-bold placeholder:text-muted-foreground/40 outline-none border-none p-0 focus-visible:ring-0"
                            autoFocus
                        />

                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Write something..."
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
                        <Button variant="ghost" size="icon" className="hover:bg-muted/50 hover:text-foreground relative">
                            <Plus className="w-6 h-6 stroke-1.5" />
                            {/* Trying to mimic circle plus visually if needed, but Plus is clean for now. 
                                 If I strictly needed CirclePlus but it failed imports, I'd use:
                                 <div className="border rounded-full p-0.5"><Plus className="w-4 h-4" /></div>
                                 But let's stick to simple Plus for stability first.
                             */}
                        </Button>
                        <Button variant="ghost" size="icon" className="hover:bg-muted/50 hover:text-foreground">
                            <Hash className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="hover:bg-muted/50 hover:text-foreground">
                            <Paperclip className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="hover:bg-muted/50 hover:text-foreground">
                            <Video className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="hover:bg-muted/50 hover:text-foreground relative overflow-hidden">
                            <label className="cursor-pointer flex items-center justify-center w-full h-full absolute inset-0">
                                <ImageIcon className="w-5 h-5" />
                                <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                            </label>
                        </Button>
                        <Button variant="ghost" size="icon" className="hover:bg-muted/50 hover:text-foreground">
                            <Smile className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="hover:bg-muted/50 hover:text-foreground hidden sm:inline-flex">
                            <BarChart2 className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="hover:bg-muted/50 hover:text-foreground hidden sm:inline-flex">
                            <Mic className="w-5 h-5" />
                        </Button>
                    </div>

                    <div className="flex items-center gap-4">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="text-muted-foreground hover:text-foreground text-sm font-normal px-2 h-auto gap-2">
                                    Choose a space to post in
                                    <ChevronDown className="w-3 h-3 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[200px]">
                                <DropdownMenuItem>General</DropdownMenuItem>
                                <DropdownMenuItem>Announcements</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                            onClick={handleSubmit}
                            disabled={isPending || isUploading || (!content.trim() && !imageFile && !title.trim())}
                            className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-full px-6 py-2 font-medium"
                        >
                            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publish"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
