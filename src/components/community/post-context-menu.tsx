
"use client";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Bookmark, Edit, Copy, Trash, Flag, Pin, Heart, MessageSquare, EyeOff, Lock, UserPlus, Bell } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { duplicatePost, updatePostSettings, reportPost, followPost, toggleBookmark, deletePost, toggleLike } from "@/actions/community";
import { Post } from "@/types";
import { CreatePost } from "./create-post";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface PostContextMenuProps {
    post: Post;
    currentUserId?: string;
    isOwner?: boolean;
    isAdmin?: boolean;
}

export function PostContextMenu({ post, currentUserId, isOwner, isAdmin }: PostContextMenuProps) {
    const [isPending, startTransition] = useTransition();
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    // Settings State (Optimistic)
    const [settings, setSettings] = useState({
        is_pinned: post.is_pinned || false,
        hide_likes: post.settings?.hide_likes || false,
        hide_comments: post.settings?.hide_comments || false,
        comments_closed: post.settings?.comments_closed || false,
        is_following: post.settings?.is_following || false
    });

    // Helper for updating settings
    const toggleSetting = (key: keyof typeof settings) => {
        const newValue = !settings[key];
        setSettings(prev => ({ ...prev, [key]: newValue }));

        startTransition(async () => {
            try {
                if (key === 'is_following') {
                    await followPost(post.id);
                    toast.success(newValue ? "Gönderi takip ediliyor" : "Takip bırakıldı");
                } else {
                    // Map local state keys to API keys if different
                    await updatePostSettings(post.id, { [key]: newValue });
                    toast.success("Ayarlar güncellendi");
                }
            } catch {
                setSettings(prev => ({ ...prev, [key]: !newValue })); // Revert
                toast.error("İşlem başarısız");
            }
        });
    };

    const handleDuplicate = () => {
        startTransition(async () => {
            try {
                await duplicatePost(post.id);
                toast.success("Gönderi kopyalandı");
            } catch { toast.error("Kopyalama başarısız"); }
        });
    };

    const handleDelete = async () => {
        try {
            await deletePost(post.id);
            toast.success("Gönderi silindi");
            setIsDeleteOpen(false);
        } catch { toast.error("Silme başarısız"); }
    };

    const handleBookmark = () => {
        startTransition(async () => {
            try { await toggleBookmark(post.id); toast.success("Kaydedilenlere eklendi/çıkarıldı"); }
            catch { toast.error("Hata"); }
        });
    };

    const handleReport = () => {
        // Just a toast for now
        toast.success("Gönderi şikayet edildi");
        reportPost(post.id, "general");
    };

    const canManage = isOwner || isAdmin;

    if (!currentUserId) return null;

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted/50 h-8 w-8 text-muted-foreground">
                        <MoreHorizontal className="w-5 h-5" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                    {/* SCENARIO B: ADMIN/OWNER */}
                    {canManage ? (
                        <>
                            <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1.5">
                                Aksiyonlar
                            </DropdownMenuLabel>

                            <DropdownMenuItem onClick={handleBookmark} className="cursor-pointer">
                                <Bookmark className="w-4 h-4 mr-2" /> Kaydet
                            </DropdownMenuItem>

                            <CreatePost user={{ id: currentUserId }} post={post}>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                                    <Edit className="w-4 h-4 mr-2" /> Düzenle
                                </DropdownMenuItem>
                            </CreatePost>

                            <DropdownMenuItem onClick={handleDuplicate} className="cursor-pointer">
                                <Copy className="w-4 h-4 mr-2" /> Çoğalt
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                onClick={() => setIsDeleteOpen(true)}
                                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                            >
                                <Trash className="w-4 h-4 mr-2" /> Sil
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1.5">
                                Etkileşim Ayarları
                            </DropdownMenuLabel>

                            <div className="px-2 py-1.5 flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <Bell className="w-4 h-4 text-gray-500" />
                                    <span>Takip Et</span>
                                </div>
                                <Switch
                                    checked={settings.is_following}
                                    onCheckedChange={() => toggleSetting('is_following')}
                                    className="scale-75"
                                />
                            </div>

                            <div className="px-2 py-1.5 flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <Pin className="w-4 h-4 text-gray-500" />
                                    <span>Tepede Sabitle</span>
                                </div>
                                <Switch
                                    checked={settings.is_pinned}
                                    onCheckedChange={() => toggleSetting('is_pinned')}
                                    className="scale-75"
                                />
                            </div>

                            <div className="px-2 py-1.5 flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <Heart className="w-4 h-4 text-gray-500" />
                                    <span>Beğenileri Gizle</span>
                                </div>
                                <Switch
                                    checked={settings.hide_likes}
                                    onCheckedChange={() => toggleSetting('hide_likes')}
                                    className="scale-75"
                                />
                            </div>

                            <div className="px-2 py-1.5 flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <EyeOff className="w-4 h-4 text-gray-500" />
                                    <span>Yorumları Gizle</span>
                                </div>
                                <Switch
                                    checked={settings.hide_comments}
                                    onCheckedChange={() => toggleSetting('hide_comments')}
                                    className="scale-75"
                                />
                            </div>

                            <div className="px-2 py-1.5 flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <Lock className="w-4 h-4 text-gray-500" />
                                    <span>Yorumlara Kapat</span>
                                </div>
                                <Switch
                                    checked={settings.comments_closed}
                                    onCheckedChange={() => toggleSetting('comments_closed')}
                                    className="scale-75"
                                />
                            </div>
                        </>
                    ) : (
                        /* SCENARIO C: MEMBER */
                        <>
                            <DropdownMenuItem onClick={handleBookmark} className="cursor-pointer">
                                <Bookmark className="w-4 h-4 mr-2" /> Kaydet
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={() => toggleSetting('is_following')} className="cursor-pointer">
                                <Bell className="w-4 h-4 mr-2" />
                                {settings.is_following ? "Takibi Bırak" : "Bu gönderiyi takip et"}
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem onClick={handleReport} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                                <Flag className="w-4 h-4 mr-2" /> Şikayet Et
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Bu gönderiyi silmek istediğine emin misin?</DialogTitle>
                        <DialogDescription>
                            Bu işlem geri alınamaz.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsDeleteOpen(false)}>İptal</Button>
                        <Button variant="destructive" onClick={handleDelete}>Evet, Sil</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
