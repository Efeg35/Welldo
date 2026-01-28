
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
import { MoreHorizontal, Bookmark, Edit, Trash, Pin, Calendar, Link as LinkIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { pinEventToSpace, toggleEventBookmark, deleteEvent } from "@/actions/events";
import { Event } from "@/types";
import { EditEventModal } from "./edit-event-modal";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import * as ics from 'ics';
import { saveAs } from 'file-saver';

interface EventContextMenuProps {
    event: Event;
    currentUserId?: string;
    isAdmin?: boolean;
}

export function EventContextMenu({ event, currentUserId, isAdmin }: EventContextMenuProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter(); // Need to import useRouter
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isPinned, setIsPinned] = useState(event.is_pinned || false);

    // Check if current user has bookmarked
    const hasBookmarked = event.bookmarks?.some((b: any) => b.user_id === currentUserId) || false;
    const [isBookmarked, setIsBookmarked] = useState(hasBookmarked);

    const handlePin = (checked: boolean) => {
        setIsPinned(checked);
        startTransition(async () => {
            try {
                await pinEventToSpace(event.id, checked);
                toast.success(checked ? "Etkinlik sabitlendi" : "Sabitleme kaldırıldı");
                router.refresh();
            } catch {
                setIsPinned(!checked);
                toast.error("Hata oluştu");
            }
        });
    };

    const handleBookmark = () => {
        const newState = !isBookmarked;
        setIsBookmarked(newState); // Optimistic update

        startTransition(async () => {
            try {
                await toggleEventBookmark(event.id);
                toast.success(newState ? "Kaydedilenlere eklendi" : "Kaydedilenlerden çıkarıldı");
                router.refresh();
            }
            catch {
                setIsBookmarked(!newState); // Revert
                toast.error("Hata oluştu");
            }
        });
    };

    const handleDelete = async () => {
        try {
            await deleteEvent(event.id);
            toast.success("Etkinlik silindi");
            setIsDeleteOpen(false);
            router.refresh();
        } catch {
            toast.error("Hata");
        }
    };

    const handleAddToCalendar = () => {
        const start = new Date(event.start_time);
        const end = new Date(event.end_time || event.start_time);

        const eventAttributes: ics.EventAttributes = {
            start: [start.getFullYear(), start.getMonth() + 1, start.getDate(), start.getHours(), start.getMinutes()],
            end: [end.getFullYear(), end.getMonth() + 1, end.getDate(), end.getHours(), end.getMinutes()],
            title: event.title,
            description: event.description || "",
            location: event.event_type === 'physical' ? event.location_address || "TBD" : "Online",
            url: event.event_url || window.location.href,
        };

        ics.createEvent(eventAttributes, (error, value) => {
            if (error) {
                console.error(error);
                return;
            }
            const blob = new Blob([value], { type: "text/calendar;charset=utf-8" });
            saveAs(blob, `${event.title}.ics`);
        });
    };

    const handleCopyLink = () => {
        const url = `${window.location.origin}/events/${event.id}`;
        navigator.clipboard.writeText(url).then(() => {
            toast.success("Bağlantı kopyalandı!");
        });
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-gray-100 rounded-lg">
                        <MoreHorizontal className="w-4 h-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1.5">
                        Aksiyonlar
                    </DropdownMenuLabel>

                    <DropdownMenuItem onClick={handleBookmark} className="cursor-pointer">
                        <Bookmark className={cn("w-4 h-4 mr-2", isBookmarked && "fill-current text-blue-600")} />
                        {isBookmarked ? "Kaydedildi" : "Kaydet"}
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={handleAddToCalendar} className="cursor-pointer">
                        <Calendar className="w-4 h-4 mr-2" /> Takvime Ekle
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
                        <LinkIcon className="w-4 h-4 mr-2" /> Bağlantıyı Kopyala
                    </DropdownMenuItem>

                    {isAdmin && (
                        <>
                            <DropdownMenuSeparator />

                            <DropdownMenuItem onClick={() => setIsEditOpen(true)} className="cursor-pointer">
                                <Edit className="w-4 h-4 mr-2" /> Düzenle
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                onClick={() => setIsDeleteOpen(true)}
                                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                            >
                                <Trash className="w-4 h-4 mr-2" /> Sil
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1.5">
                                Ayarlar
                            </DropdownMenuLabel>

                            <div className="px-2 py-1.5 flex items-center justify-between text-sm hover:bg-gray-50 rounded-sm cursor-pointer" onClick={() => handlePin(!isPinned)}>
                                <div className="flex items-center gap-2">
                                    <Pin className="w-4 h-4 text-gray-500" />
                                    <span>Alana Sabitle</span>
                                </div>
                                <Switch
                                    checked={isPinned}
                                    onCheckedChange={handlePin}
                                    className="scale-75"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            {isAdmin && (
                <>
                    <EditEventModal
                        isOpen={isEditOpen}
                        onClose={() => setIsEditOpen(false)}
                        eventId={event.id}
                        communityId={event.community_id}
                        currentUser={{ id: currentUserId } as any}
                    />

                    <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Etkinliği silmek istediğine emin misin?</DialogTitle>
                                <DialogDescription>Geri alınamaz.</DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setIsDeleteOpen(false)}>İptal</Button>
                                <Button variant="destructive" onClick={handleDelete}>Sil</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </>
            )}
        </>
    );
}
