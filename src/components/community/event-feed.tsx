"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    ChevronDown,
    Plus,
    MapPin,
    Video,
    Calendar,
    User,
    AlignLeft,
    MoreHorizontal,
    Trash2,
    Settings,
    Users,
    Pin,
    Bookmark,
    Copy,
    Edit2,
    Share2,
    Eye,
    EyeOff
} from "lucide-react";
import { CreateEventModal } from "./create-event";
import {
    deleteEvent,
    duplicateEvent,
    toggleEventPin,
    toggleEventBookmark,
    publishEvent,
    unpublishEvent,
    getEvents
} from "@/actions/events";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteSpaceDialog } from "./delete-space-dialog";
import { DeleteEventDialog } from "./delete-event-dialog";
import { ChannelSettingsOverlay } from "@/components/community/channel-settings-overlay";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

import { Channel, Profile, Event } from "@/types";

interface EventFeedProps {
    channel: Channel;
    user: Profile;
    initialEvents: Event[];
    members?: Profile[];
}

import { EditEventModal } from "./edit-event-modal";

export function EventFeed({ channel, user, initialEvents, members = [] }: EventFeedProps) {
    const router = useRouter();
    const [filter, setFilter] = useState<'upcoming' | 'past' | 'draft'>('upcoming');
    const [events, setEvents] = useState<Event[]>(initialEvents);
    const [isFetching, setIsFetching] = useState(false);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editEventId, setEditEventId] = useState<string | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteEventId, setDeleteEventId] = useState<string | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const isInstructor = user?.role === 'instructor' || user?.role === 'admin';

    // Settings
    const settings = channel.settings || {};

    const handleDraftCreated = (eventId: string) => {
        setEditEventId(eventId);
        if (filter === 'draft') {
            refreshEvents();
        }
    };

    const refreshEvents = async () => {
        setIsFetching(true);
        try {
            const data = await getEvents(channel.id, filter);
            setEvents(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsFetching(false);
        }
    };

    const handleAction = async (action: () => Promise<any>, successMsg: string) => {
        try {
            await action();
            toast.success(successMsg);
            refreshEvents();
        } catch (error: any) {
            toast.error(error.message || "İşlem başarısız");
        }
    };

    useEffect(() => {
        refreshEvents();
    }, [filter, channel.id]);

    return (
        <div className="flex flex-col h-full bg-[#FAFAFA]">
            <div className="flex-1 overflow-y-auto relative">

                {/* Cover Image */}
                {settings.cover_image_url && (
                    <div className="w-full h-48 md:h-64 relative shrink-0">
                        <img
                            src={settings.cover_image_url}
                            className="w-full h-full object-cover"
                            alt={channel.name}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                )}

                {/* Toolbar */}
                <div className={cn("sticky top-0 z-10 bg-white border-b border-border shadow-sm w-full", settings.cover_image_url && "border-t-0")}>
                    <div className="w-full px-4 md:px-8 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                                {channel.name}
                                {(isInstructor || !settings.hide_member_count) && (
                                    <span className="text-sm font-normal text-muted-foreground ml-2">
                                        ({members.length} üye)
                                    </span>
                                )}
                            </h1>
                        </div>

                        <div className="flex items-center gap-3">
                            {(isInstructor || settings.allow_members_to_create_posts !== false) && (
                                <Button onClick={() => setIsCreateModalOpen(true)} size="sm" className="bg-[#1c1c1c] hover:bg-black text-white rounded-full px-5 font-medium shadow-sm transition-all hover:scale-105 active:scale-95 h-9 cursor-pointer">
                                    Yeni etkinlik
                                </Button>
                            )}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-muted/50 rounded-full h-9 w-9 cursor-pointer">
                                        <MoreHorizontal className="w-5 h-5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    {isInstructor ? (
                                        <>
                                            <DropdownMenuItem
                                                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                                                onClick={() => setIsDeleteModalOpen(true)}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                <span>Alanı Sil</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="cursor-pointer"
                                                onClick={() => setIsSettingsOpen(true)}
                                            >
                                                <Settings className="h-4 w-4 mr-2" />
                                                <span>Ayarlar</span>
                                            </DropdownMenuItem>
                                        </>
                                    ) : (
                                        <DropdownMenuItem
                                            className="cursor-pointer"
                                            onClick={() => setIsSettingsOpen(true)}
                                        >
                                            <Users className="h-4 w-4 mr-2" />
                                            <span>Üyeler</span>
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-5xl mx-auto w-full min-h-full p-8">
                    {/* Filter Dropdown */}
                    <div className="flex items-center gap-2 mb-8">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="rounded-full bg-white border-gray-200 text-foreground font-medium flex items-center gap-2 hover:bg-gray-50 h-10 px-5 shadow-sm">
                                    {filter === 'upcoming' ? 'Yaklaşan' : filter === 'past' ? 'Geçmiş' : 'Taslak'}
                                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-48 rounded-xl shadow-lg border-gray-200">
                                <DropdownMenuItem
                                    onClick={() => setFilter('upcoming')}
                                    className={cn("cursor-pointer py-2.5 px-3", filter === 'upcoming' && "bg-gray-100 font-semibold")}
                                >
                                    Yaklaşan
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setFilter('past')}
                                    className={cn("cursor-pointer py-2.5 px-3", filter === 'past' && "bg-gray-100 font-semibold")}
                                >
                                    Geçmiş
                                </DropdownMenuItem>
                                {isInstructor && (
                                    <DropdownMenuItem
                                        onClick={() => setFilter('draft')}
                                        className={cn("cursor-pointer py-2.5 px-3 text-yellow-700", filter === 'draft' && "bg-yellow-50 font-semibold")}
                                    >
                                        Taslak
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Events List or Empty State */}
                    {isFetching ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-900 border-t-transparent" />
                        </div>
                    ) : events.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed shadow-sm">
                            <h3 className="text-xl font-bold text-foreground mb-2">
                                {filter === 'draft' ? 'Taslak etkinlik yok' : filter === 'past' ? 'Geçmiş etkinlik yok' : 'Yaklaşan etkinlik yok'}
                            </h3>
                            <p className="text-muted-foreground mb-6">
                                {filter === 'draft' ? 'Oluşturduğunuz taslaklar burada görünecek.' : 'Etkinlikler burada görünecek.'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {events.map(event => (
                                <div
                                    key={event.id}
                                    onClick={() => router.push(`/events/${event.id}`)}
                                    className="bg-white p-5 rounded-xl border shadow-sm hover:shadow-md transition-all flex gap-5 group cursor-pointer"
                                >
                                    {/* Date Box */}
                                    <div className="flex flex-col items-center justify-center w-16 h-16 rounded-lg bg-gray-50 border text-center shrink-0">
                                        <span className="text-xs uppercase font-bold text-red-500">{format(new Date(event.start_time), 'MMM', { locale: tr })}</span>
                                        <span className="text-xl font-bold text-gray-900">{format(new Date(event.start_time), 'd')}</span>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-bold text-foreground group-hover:text-blue-600 transition-colors truncate">{event.title}</h3>
                                            {event.is_pinned && (
                                                <Pin className="h-3 w-3 fill-current text-blue-500" />
                                            )}
                                            {event.status === 'draft' && (
                                                <span className="px-2 py-0.5 rounded-md bg-yellow-100 text-yellow-700 text-xs font-bold border border-yellow-200">TASLAK</span>
                                            )}
                                        </div>
                                        <div className="text-sm text-muted-foreground mt-1 flex flex-wrap items-center gap-3">
                                            <span className="flex items-center gap-1.5">
                                                <Calendar className="w-4 h-4" />
                                                {format(new Date(event.start_time), 'EEE, HH:mm', { locale: tr })} - {format(new Date(event.end_time), 'HH:mm')}
                                            </span>
                                            {event.event_type === 'online_zoom' ? (
                                                <span className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md text-xs font-medium">
                                                    <Video className="w-3 h-3" />
                                                    Zoom
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5">
                                                    <MapPin className="w-4 h-4" />
                                                    {event.location_address || 'Konum belirtilmedi'}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action / Host */}
                                    <div className="flex flex-col items-end justify-between">
                                        <div className="flex items-center gap-2">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-lg">
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleAction(() => toggleEventBookmark(event.id), "Etkinlik kaydedildi");
                                                        }}
                                                        className="cursor-pointer"
                                                    >
                                                        <Bookmark className={cn("h-4 w-4 mr-2", event.bookmarks?.some(b => b.user_id === user.id) && "fill-current text-blue-600")} />
                                                        <span>{event.bookmarks?.some(b => b.user_id === user.id) ? "Kaydedilenlerden çıkar" : "Etkinliği kaydet"}</span>
                                                    </DropdownMenuItem>

                                                    {isInstructor && (
                                                        <>
                                                            <DropdownMenuItem
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditEventId(event.id);
                                                                }}
                                                                className="cursor-pointer"
                                                            >
                                                                <Edit2 className="h-4 w-4 mr-2" />
                                                                <span>Etkinliği düzenle</span>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleAction(() => duplicateEvent(event.id), "Etkinlik çoğaltıldı");
                                                                }}
                                                                className="cursor-pointer"
                                                            >
                                                                <Copy className="h-4 w-4 mr-2" />
                                                                <span>Etkinliği çoğalt</span>
                                                            </DropdownMenuItem>

                                                            {event.status === 'draft' ? (
                                                                <DropdownMenuItem
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleAction(() => publishEvent(event.id), "Etkinlik yayınlandı");
                                                                    }}
                                                                    className="cursor-pointer text-green-600 focus:text-green-700"
                                                                >
                                                                    <Eye className="h-4 w-4 mr-2" />
                                                                    <span>Etkinliği yayınla</span>
                                                                </DropdownMenuItem>
                                                            ) : (
                                                                <DropdownMenuItem
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleAction(() => unpublishEvent(event.id), "Etkinlik taslağa çekildi");
                                                                    }}
                                                                    className="cursor-pointer text-orange-600 focus:text-orange-700"
                                                                >
                                                                    <EyeOff className="h-4 w-4 mr-2" />
                                                                    <span>Taslağa geri çek</span>
                                                                </DropdownMenuItem>
                                                            )}

                                                            <DropdownMenuSeparator />

                                                            <div className="flex items-center justify-between px-2 py-1.5" onClick={e => e.stopPropagation()}>
                                                                <div className="flex items-center">
                                                                    <Pin className={cn("h-4 w-4 mr-2", event.is_pinned && "fill-current text-blue-600")} />
                                                                    <span className="text-sm">Sabitle</span>
                                                                </div>
                                                                <Switch
                                                                    checked={event.is_pinned}
                                                                    onCheckedChange={(checked) => {
                                                                        handleAction(() => toggleEventPin(event.id, checked), checked ? "Etkinlik sabitlendi" : "Sabitleme kaldırıldı");
                                                                    }}
                                                                    className="scale-75"
                                                                />
                                                            </div>

                                                            <DropdownMenuSeparator />

                                                            <DropdownMenuItem
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setDeleteEventId(event.id);
                                                                }}
                                                                className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50"
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                <span>Etkinliği sil</span>
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <CreateEventModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                channelId={channel.id}
                communityId={channel.community_id}
                currentUser={user}
                onDraftCreated={handleDraftCreated}
            />

            {editEventId && (
                <EditEventModal
                    isOpen={!!editEventId}
                    onClose={() => setEditEventId(null)}
                    eventId={editEventId}
                    communityId={channel.community_id}
                    currentUser={user}
                />
            )}
            <DeleteSpaceDialog
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                channelId={channel.id}
                channelName={channel.name}
            />
            <DeleteEventDialog
                isOpen={!!deleteEventId}
                onClose={() => setDeleteEventId(null)}
                onConfirm={async () => {
                    if (deleteEventId) {
                        await handleAction(() => deleteEvent(deleteEventId), "Etkinlik silindi");
                    }
                }}
            />
            {isSettingsOpen && (
                <ChannelSettingsOverlay
                    channel={channel}
                    members={members}
                    isAdmin={isInstructor}
                    onClose={() => setIsSettingsOpen(false)}
                />
            )}
        </div>
    );
}

