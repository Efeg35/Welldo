"use client";

import { useState, useEffect, useMemo } from "react";
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
    CheckCircle2,
    Circle,
    Eye,
    EyeOff,
    Lock,
    XCircle
} from "lucide-react";
import { CreateEventModal } from "./create-event";
import {
    deleteEvent,
    duplicateEvent,
    toggleEventPin,
    toggleEventBookmark,
    publishEvent,
    unpublishEvent,
    getEvents,
    setEventResponse,
    removeEventResponse
} from "@/actions/events";
import { updateChannel } from "@/actions/community";
import { format, formatDistanceToNow, isThisMonth, isThisYear, startOfMonth } from "date-fns";
import { tr } from "date-fns/locale";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

import { DeleteSpaceDialog } from "./delete-space-dialog";
import { DeleteEventDialog } from "./delete-event-dialog";
import { ChannelSettingsOverlay } from "@/components/community/channel-settings-overlay";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { RegistrationSuccessModal } from "./registration-success-modal";

import { Channel, Profile, Event } from "@/types";

interface EventFeedProps {
    channel: Channel;
    user: Profile;
    initialEvents: Event[];
    members?: Profile[];
}

import { EditEventModal } from "./edit-event-modal";

// Helper to group events by month
function groupEventsByMonth(events: Event[]): Map<string, Event[]> {
    const groups = new Map<string, Event[]>();
    events.forEach(event => {
        const monthKey = format(new Date(event.start_time), 'MMMM yyyy', { locale: tr });
        if (!groups.has(monthKey)) {
            groups.set(monthKey, []);
        }
        groups.get(monthKey)!.push(event);
    });
    return groups;
}

// Helper to calculate "Starts in X days" text
function getStartsInText(startTime: string): string | null {
    const now = new Date();
    const start = new Date(startTime);
    const diffMs = start.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return null;
    if (diffDays === 0) return "Bugün";
    if (diffDays === 1) return "Yarın";
    if (diffDays <= 7) return `${diffDays} gün sonra`;
    return null;
}

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

    // Success Modal State
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successEvent, setSuccessEvent] = useState<Event | null>(null);

    const isInstructor = user?.role === 'instructor' || user?.role === 'admin';

    // Settings
    const settings = channel.settings || {};

    // Separate next event from the rest
    const { nextEvent, remainingEvents, groupedEvents } = useMemo(() => {
        if (filter !== 'upcoming' || events.length === 0) {
            return { nextEvent: null, remainingEvents: events, groupedEvents: groupEventsByMonth(events) };
        }
        const [first, ...rest] = events;
        return {
            nextEvent: first,
            remainingEvents: rest,
            groupedEvents: groupEventsByMonth(rest)
        };
    }, [events, filter]);

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

    // RSVP handler for optimistic updates
    const handleRSVP = async (event: Event, status: 'attending' | 'not_attending') => {
        const updatedEvents = events.map(ev => {
            if (ev.id === event.id) {
                const existingResponse = ev.responses?.find(r => r.user_id === user.id);
                if (existingResponse) {
                    return {
                        ...ev,
                        responses: ev.responses?.map(r =>
                            r.user_id === user.id ? { ...r, status } : r
                        )
                    };
                } else {
                    return {
                        ...ev,
                        responses: [...(ev.responses || []), {
                            user_id: user.id,
                            status,
                            user: {
                                id: user.id,
                                full_name: user.full_name || 'Kullanıcı',
                                avatar_url: user.avatar_url || null
                            }
                        }]
                    };
                }
            }
            return ev;
        });
        setEvents(updatedEvents as Event[]);

        try {
            await setEventResponse(event.id, status);
            if (status === 'attending') {
                setSuccessEvent(event);
                setShowSuccessModal(true);
            } else {
                toast.success("Katılım iptal edildi");
            }
        } catch (error: any) {
            await refreshEvents();
            toast.error(error.message || "Bir hata oluştu");
        }
    };

    // Render RSVP/Ticket Button
    const renderActionButton = (event: Event, size: 'sm' | 'default' = 'sm') => {
        if (event.status !== 'published') return null;

        const userResponse = event.responses?.find(r => r.user_id === user.id);

        if (event.ticket_price > 0) {
            // Paid event
            if (event.tickets?.some(t => t.user_id === user.id)) {
                return (
                    <div className="h-8 px-3 rounded-full text-sm font-medium bg-green-50 text-green-700 border border-green-200 flex items-center gap-1.5 shadow-sm">
                        <CheckCircle2 className="w-4 h-4 fill-green-600 text-white" />
                        Biletli
                    </div>
                );
            }
            return (
                <Button
                    variant="default"
                    size={size}
                    className="h-8 px-4 rounded-full text-sm font-medium bg-[#1c1c1c] hover:bg-black text-white shadow-sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/events/${event.id}`);
                    }}
                >
                    Bilet Al - ₺{event.ticket_price}
                </Button>
            );
        }

        // Free event - RSVP
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size={size}
                        className={cn(
                            "h-8 px-3 rounded-full text-sm font-medium transition-colors border shadow-sm",
                            userResponse?.status === 'attending'
                                ? "bg-white text-green-700 hover:text-green-800 border-gray-200 hover:bg-gray-50"
                                : "bg-white text-gray-700 hover:text-gray-900 border-gray-200 hover:bg-gray-50"
                        )}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {userResponse?.status === 'attending' ? (
                            <>
                                <CheckCircle2 className="w-4 h-4 mr-1.5 fill-green-600 text-white" />
                                Katılıyorum
                            </>
                        ) : userResponse?.status === 'not_attending' ? (
                            <>
                                <XCircle className="w-4 h-4 mr-1.5 text-gray-600" />
                                Katılmıyorum
                            </>
                        ) : (
                            <>
                                Durumunu seç
                                <ChevronDown className="w-3 h-3 ml-1.5 opacity-50" />
                            </>
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-lg border-gray-200 p-1">
                    <DropdownMenuItem
                        onClick={(e) => {
                            e.stopPropagation();
                            handleRSVP(event, 'attending');
                        }}
                        className="cursor-pointer flex items-center justify-between"
                    >
                        <div className="flex items-center">
                            <CheckCircle2 className={cn(
                                "w-4 h-4 mr-2",
                                userResponse?.status === 'attending' ? "text-green-600" : "text-gray-400"
                            )} />
                            <span>Katılıyorum</span>
                        </div>
                        {userResponse?.status === 'attending' && (
                            <div className="w-2 h-2 rounded-full bg-green-600" />
                        )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={(e) => {
                            e.stopPropagation();
                            handleRSVP(event, 'not_attending');
                        }}
                        className="cursor-pointer flex items-center justify-between"
                    >
                        <div className="flex items-center">
                            <XCircle className={cn(
                                "w-4 h-4 mr-2",
                                userResponse?.status === 'not_attending' ? "text-gray-600" : "text-gray-400"
                            )} />
                            <span>Katılmıyorum</span>
                        </div>
                        {userResponse?.status === 'not_attending' && (
                            <div className="w-2 h-2 rounded-full bg-gray-600" />
                        )}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    };

    // Render 3-dot menu (preserved from original)
    const renderEventMenu = (event: Event) => (
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
    );

    // Featured Event Card Component (Large)
    const FeaturedEventCard = ({ event }: { event: Event }) => {
        const startsIn = getStartsInText(event.start_time);
        const attendeeCount = event.responses?.filter(r => r.status === 'attending').length || 0;

        return (
            <div
                onClick={() => router.push(`/events/${event.id}`)}
                className="bg-white rounded-xl border shadow-sm overflow-hidden cursor-pointer group hover:shadow-lg transition-all"
            >
                {/* Cover Image */}
                <div className="relative w-full h-48 md:h-64 overflow-hidden">
                    {event.cover_image_url ? (
                        <img
                            src={event.cover_image_url}
                            alt={event.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div
                            className="w-full h-full"
                            style={{
                                background: `repeating-linear-gradient(
                                    135deg,
                                    #e2e8f0,
                                    #e2e8f0 1px,
                                    #f1f5f9 1px,
                                    #f1f5f9 12px
                                )`
                            }}
                        />
                    )}
                </div>

                {/* Content */}
                <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold text-foreground group-hover:text-violet-600 transition-colors truncate">
                                {event.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                {format(new Date(event.start_time), "EEEE, d MMMM, HH:mm", { locale: tr })} - {format(new Date(event.end_time), "HH:mm")}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                            {renderActionButton(event, 'default')}
                            {renderEventMenu(event)}
                        </div>
                    </div>

                    {/* Tags Row */}
                    <div className="flex flex-wrap items-center gap-2 mt-4">
                        {startsIn && (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {startsIn}
                            </span>
                        )}
                        {event.event_type === 'online_zoom' ? (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5">
                                <Video className="w-3 h-3" />
                                Canlı Oda
                            </span>
                        ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200 flex items-center gap-1.5">
                                <MapPin className="w-3 h-3" />
                                Yüz yüze
                            </span>
                        )}
                        {attendeeCount > 0 && (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200 flex items-center gap-1.5">
                                <Users className="w-3 h-3" />
                                {attendeeCount} katılımcı
                            </span>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // Small Event Card Component (List Item)
    const SmallEventCard = ({ event }: { event: Event }) => {
        const attendeeCount = event.responses?.filter(r => r.status === 'attending').length || 0;

        return (
            <div
                onClick={() => router.push(`/events/${event.id}`)}
                className="bg-white p-4 rounded-xl border shadow-sm hover:shadow-md transition-all flex gap-4 group cursor-pointer"
            >
                {/* Thumbnail */}
                <div className="w-32 h-20 rounded-lg overflow-hidden shrink-0">
                    {event.cover_image_url ? (
                        <img
                            src={event.cover_image_url}
                            alt={event.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    ) : (
                        <div
                            className="w-full h-full"
                            style={{
                                background: `repeating-linear-gradient(
                                    135deg,
                                    #e2e8f0,
                                    #e2e8f0 1px,
                                    #f1f5f9 1px,
                                    #f1f5f9 8px
                                )`
                            }}
                        />
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground group-hover:text-violet-600 transition-colors truncate">
                            {event.title}
                        </h3>
                        {event.is_pinned && (
                            <Pin className="h-3 w-3 fill-current text-blue-500 shrink-0" />
                        )}
                        {event.status === 'draft' && (
                            <span className="px-2 py-0.5 rounded-md bg-yellow-100 text-yellow-700 text-xs font-bold border border-yellow-200 shrink-0">TASLAK</span>
                        )}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1 flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {format(new Date(event.start_time), "EEE, d MMM, HH:mm", { locale: tr })}
                        </span>
                        {event.event_type === 'online_zoom' ? (
                            <span className="flex items-center gap-1 text-blue-600">
                                <Video className="w-3.5 h-3.5" />
                                Zoom
                            </span>
                        ) : event.location_address && (
                            <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                {event.location_address}
                            </span>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                    {renderActionButton(event)}
                    {renderEventMenu(event)}
                </div>
            </div>
        );
    };

    return (
        <div className="bg-[#FAFAFA] min-h-full">
            <div className="relative">

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
                <div className="max-w-3xl mx-auto w-full min-h-full p-6 md:p-8">
                    {/* Filter Dropdown */}
                    <div className="flex items-center gap-2 mb-6">
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
                    ) : filter === 'upcoming' && nextEvent ? (
                        <div className="space-y-8">
                            {/* Next Event Section */}
                            <div>
                                <h2 className="text-lg font-bold text-foreground mb-4">Sıradaki Etkinlik</h2>
                                <FeaturedEventCard event={nextEvent} />
                            </div>

                            {/* Remaining Events by Month */}
                            {remainingEvents.length > 0 && (
                                <div className="space-y-6">
                                    {Array.from(groupedEvents.entries()).map(([monthLabel, monthEvents]) => (
                                        <div key={monthLabel}>
                                            <h2 className="text-lg font-bold text-foreground mb-4 capitalize">{monthLabel}</h2>
                                            <div className="space-y-3">
                                                {monthEvents.map(event => (
                                                    <SmallEventCard key={event.id} event={event} />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        // Past or Draft events - simple list
                        <div className="space-y-3">
                            {events.map(event => (
                                <SmallEventCard key={event.id} event={event} />
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

            <RegistrationSuccessModal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                event={successEvent}
            />
        </div>
    );
}
