"use client";

import { format, differenceInDays, isPast, isSameDay } from "date-fns";
import { tr } from "date-fns/locale";
import { MapPin, Video, Check, ChevronDown, MoreHorizontal, User, Clock, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Event } from "@/types";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useState, useTransition } from "react";
import { setEventResponse, removeEventResponse } from "@/actions/events";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { EventContextMenu } from "@/components/community/event-context-menu";

interface EventsListViewProps {
    events: Event[];
    onEventClick: (event: Event) => void;
    userId?: string;
    isAdmin?: boolean;
}

export function EventsListView({ events, onEventClick, userId, isAdmin }: EventsListViewProps) {
    const [timeFilter, setTimeFilter] = useState<"upcoming" | "past">("upcoming");
    const router = useRouter();

    if (events.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <User className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Etkinlik bulunamadı</h3>
                <p className="text-gray-500 text-sm">Filtreleri değiştirmeyi deneyin.</p>
            </div>
        );
    }

    const sortedEvents = [...events].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    const filteredByTime = sortedEvents.filter(event => {
        const eventDate = new Date(event.start_time);
        return timeFilter === "upcoming" ? !isPast(eventDate) : isPast(eventDate);
    });

    const nextEvent = timeFilter === "upcoming" ? filteredByTime[0] : null;
    const otherEvents = timeFilter === "upcoming" ? filteredByTime.slice(1) : filteredByTime;

    const groupedEvents: { [key: string]: Event[] } = {};
    otherEvents.forEach(event => {
        const date = new Date(event.start_time);
        const key = format(date, "MMMM yyyy", { locale: tr });
        if (!groupedEvents[key]) {
            groupedEvents[key] = [];
        }
        groupedEvents[key].push(event);
    });

    // Sort events within each group: Pinned first, then by date
    Object.keys(groupedEvents).forEach(key => {
        groupedEvents[key].sort((a, b) => {
            if ((a.is_pinned || false) !== (b.is_pinned || false)) {
                return (b.is_pinned || false) ? 1 : -1;
            }
            return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
        });
    });

    return (
        <div className="min-h-full bg-[#f9fafb]">
            {/* Tabs Section */}
            <div className="max-w-4xl mx-auto px-6 pt-8 pb-4">
                <div className="inline-flex bg-[#eeeeee] p-1 rounded-lg">
                    <button
                        onClick={() => setTimeFilter("upcoming")}
                        className={cn(
                            "px-4 py-1.5 text-sm font-semibold rounded-[6px] transition-all",
                            timeFilter === "upcoming"
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-900"
                        )}
                    >
                        Yaklaşan
                    </button>
                    <button
                        onClick={() => setTimeFilter("past")}
                        className={cn(
                            "px-4 py-1.5 text-sm font-semibold rounded-[6px] transition-all",
                            timeFilter === "past"
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-900"
                        )}
                    >
                        Geçmiş
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 pb-20 space-y-10">
                {filteredByTime.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-[#6f767e] text-sm">
                            {timeFilter === "upcoming" ? "Yaklaşan etkinlik bulunmuyor." : "Geçmiş etkinlik bulunmuyor."}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* NEXT EVENT SECTION */}
                        {nextEvent && timeFilter === "upcoming" && (
                            <section className="space-y-4">
                                <h2 className="text-[17px] font-bold text-[#1a1d1f] tracking-tight">Sıradaki Etkinlik</h2>
                                <FeaturedEventCard
                                    event={nextEvent}
                                    onClick={() => onEventClick(nextEvent)}
                                    userId={userId}
                                    isAdmin={isAdmin}
                                    onRefresh={() => router.refresh()}
                                />
                            </section>
                        )}

                        {/* MONTHLY GROUPS */}
                        {Object.entries(groupedEvents).map(([monthYear, monthEvents]) => (
                            <section key={monthYear} className="space-y-4">
                                <h2 className="text-[17px] font-bold text-[#1a1d1f] capitalize tracking-tight">{monthYear}</h2>
                                <div className="bg-white rounded-2xl border border-[#eceef0] overflow-hidden divide-y divide-[#eceef0] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                                    {monthEvents.map(event => (
                                        <EventListRow
                                            key={event.id}
                                            event={event}
                                            onClick={() => onEventClick(event)}
                                            userId={userId}
                                            isAdmin={isAdmin}
                                            onRefresh={() => router.refresh()}
                                        />
                                    ))}
                                </div>
                            </section>
                        ))}
                    </>
                )}
            </div>
        </div>
    );
}

// --- SUB COMPONENTS ---

// --- HELPER FOR AVATARS ---
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";


function AttendeeAvatars({ event, limit = 5, isAdmin }: { event: Event, limit?: number, isAdmin?: boolean }) {
    const router = useRouter();

    // Merge attendees from tickets (paid) and responses (free)
    const attendees = [
        ...(event.tickets?.map((t: any) => t.user) || []),
        ...(event.responses?.filter(r => r.status === 'attending').map(r => r.user) || [])
    ].filter((v, i, a) => a.findIndex(t => t?.id === v?.id) === i && !!v);

    if (attendees.length === 0) return null;

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isAdmin) {
            router.push(`/events/${event.id}`);
        }
    };

    return (
        <div
            className={cn("flex items-center -space-x-2 transition-opacity", isAdmin && "cursor-pointer hover:opacity-80")}
            onClick={handleClick}
        >
            {attendees.slice(0, limit).map((user) => (
                <Avatar key={user.id} className="w-6 h-6 border-2 border-white ring-1 ring-gray-100">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="text-[8px] bg-gray-100 text-gray-500">
                        {user.full_name?.[0]?.toUpperCase()}
                    </AvatarFallback>
                </Avatar>
            ))}
            {attendees.length > limit && (
                <div className="w-6 h-6 rounded-full bg-gray-50 border-2 border-white flex items-center justify-center text-[8px] font-medium text-gray-500 ring-1 ring-gray-100">
                    +{attendees.length - limit}
                </div>
            )}
        </div>
    );
}

interface EventCardProps {
    event: Event;
    onClick: () => void;
    userId?: string;
    isAdmin?: boolean;
    onRefresh: () => void;
}

function FeaturedEventCard({ event, onClick, userId, isAdmin, onRefresh }: EventCardProps) {
    const startDate = new Date(event.start_time);
    const endDate = event.end_time ? new Date(event.end_time) : null;
    const isPhysical = event.event_type === "physical";
    const daysLeft = differenceInDays(startDate, new Date());
    const isAttending = userId ? event.responses?.some(r => r.user_id === userId && r.status === "attending") : false;
    const isPaid = event.ticket_price > 0;
    const hasTicket = event.tickets?.some(t => t.user_id === userId);

    // Stock Calculation
    const settings = event.settings as any;
    const rsvpLimit = settings?.attendees?.rsvp_limit;
    const currentCount = isPaid ? (event.tickets?.length || 0) : (event.responses?.filter(r => r.status === 'attending').length || 0);
    const remainingStock = rsvpLimit ? Math.max(0, rsvpLimit - currentCount) : null;

    return (
        <div
            onClick={onClick}
            className={cn(
                "group rounded-2xl border p-6 shadow-sm hover:shadow-md transition-all cursor-pointer relative",
                isPaid ? "bg-[#fffdf5] border-[#f5f0d0]" : "bg-white border-[#eceef0]"
            )}
        >
            <div className="flex items-start justify-between gap-6 mb-8">
                <div className="space-y-2 flex-1">
                    <h3 className="text-[20px] font-bold text-[#1a1d1f] leading-tight group-hover:text-[#278c48] transition-colors tracking-tight">
                        {event.title}
                    </h3>
                    <div className="text-[15px] text-[#6f767e] font-medium tracking-tight">
                        {format(startDate, "EEEE, d MMM, HH:mm", { locale: tr })}
                        {endDate && ` – ${format(endDate, isSameDay(startDate, endDate) ? "HH:mm" : "EEEE, d MMM, HH:mm", { locale: tr })}`}
                        <span className="ml-1 uppercase text-xs font-semibold">GMT+3</span>
                    </div>
                </div>

                {/* Right Action Section */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3">
                            {isPaid && remainingStock !== null && (
                                <span className="text-[11px] font-bold text-red-600 uppercase tracking-wide">
                                    SON {remainingStock} KİŞİ
                                </span>
                            )}
                            <RSVPButton
                                eventId={event.id}
                                isAttending={!!isAttending || !!hasTicket}
                                isPaid={isPaid}
                                price={event.ticket_price}
                                userId={userId}
                                onRefresh={onRefresh}
                                onClick={onClick}
                            />
                        </div>
                        <EventContextMenu
                            event={event}
                            currentUserId={userId}
                            isAdmin={isAdmin}
                        />
                    </div>
                    {/* Avatars below actions */}
                    <div className="pr-10">
                        <AttendeeAvatars event={event} isAdmin={isAdmin} />
                    </div>
                </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2.5">
                {daysLeft >= 0 && daysLeft <= 7 && (
                    <span className="px-2.5 py-1.5 rounded-lg bg-[#ebfbf0] text-[#278c48] text-[11px] font-bold tracking-wide uppercase">
                        {daysLeft === 0 ? "Bugün" : `${daysLeft} gün kaldı`}
                    </span>
                )}

                <span className="px-2.5 py-1.5 rounded-lg bg-[#f4f4f4] text-[#6f767e] text-[11px] font-bold flex items-center gap-1.5">
                    {isPhysical ? <><MapPin className="w-3.5 h-3.5" /> Yüzyüze</> : <><Video className="w-3.5 h-3.5" /> Canlı Yayın</>}
                </span>

                <span className="px-2.5 py-1.5 rounded-lg bg-[#f4f4f4] text-[#6f767e] text-[11px] font-bold flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> {event.community?.name || "WellDo"}
                </span>
            </div>
        </div>
    )
}

function EventListRow({ event, onClick, userId, isAdmin, onRefresh }: EventCardProps) {
    const startDate = new Date(event.start_time);
    const endDate = event.end_time ? new Date(event.end_time) : null;
    const isPhysical = event.event_type === "physical";
    const isAttending = userId ? event.responses?.some(r => r.user_id === userId && r.status === "attending") : false;
    const isPaid = event.ticket_price > 0;
    const hasTicket = event.tickets?.some(t => t.user_id === userId);

    // Stock Calculation
    const settings = event.settings as any;
    const rsvpLimit = settings?.attendees?.rsvp_limit;
    const currentCount = isPaid ? (event.tickets?.length || 0) : (event.responses?.filter(r => r.status === 'attending').length || 0);
    const remainingStock = rsvpLimit ? Math.max(0, rsvpLimit - currentCount) : null;

    return (
        <div
            onClick={onClick}
            className={cn(
                "flex items-center gap-5 p-5 hover:bg-[#fcfcfc] transition-colors cursor-pointer group",
                isPaid && "bg-[#fffdf5] hover:bg-[#fffae8]"
            )}
        >
            {/* Date Box */}
            <div className="shrink-0 flex flex-col items-center justify-center w-[48px] h-[56px] bg-[#f4f4f4] rounded-[10px] border border-transparent group-hover:bg-[#ebfbf0]/50 group-hover:border-[#ebfbf0] transition-colors">
                <span className="text-[18px] font-bold text-[#1a1d1f] leading-none">
                    {format(startDate, "d")}
                </span>
                <span className="text-[10px] font-bold uppercase text-[#6f767e] mt-0.5 tracking-wider">
                    {format(startDate, "MMM", { locale: tr })}
                </span>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                    <h4 className="text-[15px] font-bold text-[#1a1d1f] group-hover:text-[#278c48] transition-colors truncate tracking-tight">
                        {event.title}
                    </h4>
                    {/* Avatars strictly in content flow on mobile, but here for general layout */}
                    <div className="hidden sm:block">
                        <AttendeeAvatars event={event} limit={3} isAdmin={isAdmin} />
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-[#6f767e] font-medium tracking-tight">
                    <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#9ea4aa]" />
                        {format(startDate, "EEEE, HH:mm", { locale: tr })}
                        {endDate && ` – ${format(endDate, "HH:mm")}`}
                    </span>
                    <span className="text-[#e6e8eb] hidden sm:inline">•</span>
                    <span className="flex items-center gap-1.5">
                        {isPhysical ? <MapPin className="w-2.5 h-2.5 text-[#9ea4aa]" /> : <Video className="w-2.5 h-2.5 text-[#9ea4aa]" />}
                        {isPhysical ? (event.location_address || "Konum belirtilmedi") : "Canlı Etkinlik"}
                    </span>
                </div>
            </div>

            {/* Actions */}
            <div className="shrink-0 flex flex-col items-end gap-1" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-2">
                    {isPaid && remainingStock !== null && (
                        <span className="text-[10px] font-bold text-red-600 uppercase tracking-wide whitespace-nowrap">
                            Son {remainingStock}
                        </span>
                    )}
                    <RSVPButton
                        eventId={event.id}
                        isAttending={!!isAttending || !!hasTicket}
                        isPaid={isPaid}
                        price={event.ticket_price}
                        userId={userId}
                        onRefresh={onRefresh}
                        onClick={onClick}
                        small
                    />

                    <EventContextMenu
                        event={event}
                        currentUserId={userId}
                        isAdmin={isAdmin}
                    />
                </div>
                {/* Mobile Avatar Fallback */}
                <div className="sm:hidden mt-1">
                    <AttendeeAvatars event={event} limit={3} isAdmin={isAdmin} />
                </div>
            </div>
        </div>
    )
}

// --- RSVP BUTTON WITH DROPDOWN ---

interface RSVPButtonProps {
    eventId: string;
    isAttending: boolean;
    isPaid: boolean;
    price: number;
    userId?: string;
    onRefresh: () => void;
    onClick: () => void;
    small?: boolean;
}

function RSVPButton({ eventId, isAttending, isPaid, price, userId, onRefresh, onClick, small }: RSVPButtonProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleRSVP = async (e: React.MouseEvent, status: 'attending' | 'not_attending') => {
        e.stopPropagation();

        if (!userId) {
            router.push("/login");
            return;
        }

        startTransition(async () => {
            try {
                if (status === 'not_attending') {
                    await removeEventResponse(eventId);
                    toast.success("Katılım iptal edildi");
                } else {
                    await setEventResponse(eventId, status);
                    toast.success("Katılım kaydedildi!");
                }
                onRefresh();
            } catch (error: any) {
                toast.error(error.message || "Bir hata oluştu");
            }
        });
    };

    // Already attending - show status with dropdown
    if (isAttending) {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center group/rsvp cursor-pointer">
                        <Button
                            variant="ghost"
                            size={small ? "sm" : "default"}
                            className={cn(
                                "bg-[#ebfbf0] text-[#278c48] hover:bg-[#d8f7e3] hover:text-[#278c48] rounded-l-xl rounded-r-none gap-2 font-bold border-r border-[#d4f2dc] transition-all pointer-events-none",
                                small ? "h-8 px-3 text-xs" : "h-10 px-4 text-sm"
                            )}
                            disabled={isPending}
                        >
                            {isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Check className="w-4 h-4" />
                            )}
                            {isPaid ? "Bilet Alındı" : "Katılıyorum"}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "bg-[#ebfbf0] text-[#278c48] hover:bg-[#d8f7e3] hover:text-[#278c48] rounded-r-xl rounded-l-none border-l-0 p-0 transition-all pointer-events-none",
                                small ? "h-8 w-6" : "h-10 w-8"
                            )}
                        >
                            <ChevronDown className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                        className="text-[#278c48] font-medium"
                        disabled
                    >
                        <Check className="w-4 h-4 mr-2" /> Katılıyorum
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={(e) => handleRSVP(e as any, 'not_attending')}
                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                        disabled={isPending}
                    >
                        <X className="w-4 h-4 mr-2" /> Katılmıyorum
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    // Paid event - show buy ticket button
    if (isPaid) {
        return (
            <Button
                variant="default"
                size={small ? "sm" : "default"}
                className={cn(
                    "bg-[#1a1d1f] text-white hover:bg-black rounded-xl font-bold transition-all active:scale-95 shadow-sm",
                    small ? "h-8 px-3 text-xs" : "h-10 px-5 text-sm"
                )}
                onClick={(e) => {
                    e.stopPropagation();
                    onClick(); // Opens detail panel for ticket purchase
                }}
            >
                ₺{price} – Bilet Al
            </Button>
        );
    }

    // Free event - show join dropdown
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                    variant="ghost"
                    size={small ? "sm" : "default"}
                    className={cn(
                        "bg-white border border-[#eceef0] text-[#1a1d1f] hover:bg-[#f4f4f4] rounded-xl font-bold transition-all hover:border-[#dfe1e4] gap-1",
                        small ? "h-8 px-4 text-xs" : "h-10 px-6 text-sm"
                    )}
                    disabled={isPending}
                >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Katıl"}
                    <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                    onClick={(e) => handleRSVP(e as any, 'attending')}
                    className="font-medium"
                    disabled={isPending}
                >
                    <Check className="w-4 h-4 mr-2 text-[#278c48]" /> Katılıyorum
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={(e) => handleRSVP(e as any, 'not_attending')}
                    disabled={isPending}
                >
                    <X className="w-4 h-4 mr-2 text-gray-400" /> Katılmıyorum
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
