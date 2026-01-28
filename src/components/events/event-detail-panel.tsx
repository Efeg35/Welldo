"use client";

import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Calendar,
    Clock,
    MapPin,
    Video,
    ExternalLink,
    Users,
    Ticket,
    X,
    Loader2,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import type { Event } from "@/types";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface EventDetailPanelProps {
    event: Event | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userId?: string;
    isAdmin?: boolean;
}

export function EventDetailPanel({
    event,
    open,
    onOpenChange,
    userId,
    isAdmin,
}: EventDetailPanelProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    if (!event) return null;

    const startDate = new Date(event.start_time);
    const endDate = event.end_time ? new Date(event.end_time) : null;
    const isPhysical = event.event_type === "physical";
    const attendeeCount = event.responses?.filter((r) => r.status === "attending").length || 0;
    const hasTicket = event.tickets?.some((t) => t.user_id === userId);
    const isAttending = event.responses?.some((r) => r.user_id === userId && r.status === "attending");

    // Google Calendar link
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${format(startDate, "yyyyMMdd'T'HHmmss")}${endDate ? `/${format(endDate, "yyyyMMdd'T'HHmmss")}` : ""}&details=${encodeURIComponent(event.description || "")}&location=${encodeURIComponent(event.location_address || "")}`;

    const handleBuyTicket = async () => {
        if (!userId) {
            router.push("/login");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch("/api/payments/ticket", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ eventId: event.id }),
            });
            const data = await res.json();
            if (data.free || data.restored) {
                router.refresh();
                onOpenChange(false);
            } else if (data.checkoutFormContent) {
                const checkoutDiv = document.createElement("div");
                checkoutDiv.innerHTML = data.checkoutFormContent;
                document.body.appendChild(checkoutDiv);
                const scripts = checkoutDiv.getElementsByTagName("script");
                for (let i = 0; i < scripts.length; i++) {
                    eval(scripts[i].innerText);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleManageAttendees = () => {
        router.push(`/events/${event.id}`);
        onOpenChange(false);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
                {/* Header with Close */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 mr-8">
                    <SheetTitle className="text-lg font-bold text-gray-900">
                        Etkinlik Detayı
                    </SheetTitle>
                    {/* Default SheetClose is absolute positioned top-4 right-4 from SheetContent */}
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                    {/* Cover Image */}
                    {event.cover_image_url && (
                        <div className="aspect-video w-full overflow-hidden">
                            <img
                                src={event.cover_image_url}
                                alt={event.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    <div className="p-6 space-y-6">
                        {/* ... (truncated for brevity, ensure context matches) ... */}
                        {/* Actually easier to just replace the header block and the specific location block separately or carefully */}
                        {/* Let me try a cleaner replacement for the Header first */}


                        {/* Title & Type */}
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                {isPhysical ? (
                                    <span className="flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                                        <MapPin className="w-3 h-3" /> Yüzyüze
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                        <Video className="w-3 h-3" /> Çevrimiçi
                                    </span>
                                )}
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">{event.title}</h2>
                        </div>

                        {/* Date & Time */}
                        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                            <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 flex flex-col items-center justify-center shrink-0">
                                <span className="text-lg font-bold text-gray-900 leading-none">
                                    {format(startDate, "d")}
                                </span>
                                <span className="text-[10px] font-medium text-gray-500 uppercase">
                                    {format(startDate, "MMM", { locale: tr })}
                                </span>
                            </div>
                            <div className="flex-1">
                                <div className="font-semibold text-gray-900">
                                    {format(startDate, "EEEE, d MMMM yyyy", { locale: tr })}
                                </div>
                                <div className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    {format(startDate, "HH:mm")}
                                    {endDate && ` - ${format(endDate, "HH:mm")}`}
                                    <span className="text-gray-400 ml-1">(GMT+3)</span>
                                </div>
                                <div className="mt-3 flex items-center gap-3">
                                    <a
                                        href={googleCalendarUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                    >
                                        <Calendar className="w-3 h-3" /> Google Takvime Ekle
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                Konum
                            </h3>
                            {isPhysical && event.location_address ? (
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <p className="text-gray-900">{event.location_address}</p>
                                    <a
                                        href={`https://maps.google.com/?q=${encodeURIComponent(event.location_address)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-2"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" /> Yol Tarifi Al
                                    </a>
                                </div>
                            ) : (
                                <div className="p-4 bg-blue-50 rounded-xl">
                                    <p className="text-blue-900 font-medium flex items-center gap-2">
                                        <Video className="w-4 h-4" /> Çevrimiçi Etkinlik
                                    </p>
                                    {hasTicket || isAttending ? (
                                        event.event_url ? (
                                            <div className="mt-2 text-sm text-blue-700">
                                                <p className="mb-2">Etkinlik linki:</p>
                                                <a href={event.event_url} target="_blank" rel="noopener noreferrer" className="font-medium underline hover:text-blue-900 break-all">
                                                    {event.event_url}
                                                </a>
                                                <p className="mt-1 text-xs text-blue-600">Link ayrıca e-posta ile gönderildi.</p>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-blue-700 mt-1">
                                                Etkinlik linki yakında eklenecektir.
                                            </p>
                                        )
                                    ) : (
                                        <p className="text-sm text-blue-600 mt-1">
                                            Katılım linki bilet satın alındıktan veya kayıt olduktan sonra görünecektir.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        {event.description && (
                            <div className="space-y-2">
                                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                    Açıklama
                                </h3>
                                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                                    {event.description}
                                </p>
                            </div>
                        )}

                        {/* Attendees Preview */}
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                Katılımcılar ({attendeeCount})
                            </h3>
                            <div className="flex items-center gap-2">
                                <div className="flex -space-x-2">
                                    {event.responses
                                        ?.filter((r) => r.status === "attending")
                                        .slice(0, 5)
                                        .map((r: any) => (
                                            <Avatar key={r.user_id} className="w-8 h-8 border-2 border-white">
                                                <AvatarImage src={r.user?.avatar_url} />
                                                <AvatarFallback className="bg-gray-100 text-gray-700 text-xs">
                                                    {getInitials(r.user?.full_name || "?")}
                                                </AvatarFallback>
                                            </Avatar>
                                        ))}
                                </div>
                                {attendeeCount > 5 && (
                                    <span className="text-sm text-gray-500">+{attendeeCount - 5} kişi</span>
                                )}
                            </div>
                        </div>

                        {/* Organizer Manage Button */}
                        {isAdmin && (
                            <Button
                                variant="outline"
                                className="w-full gap-2"
                                onClick={handleManageAttendees}
                            >
                                <Users className="w-4 h-4" />
                                Katılımcıları Yönet
                            </Button>
                        )}
                    </div>
                </div>

                {/* Bottom Sticky Bar */}
                <div className="border-t border-gray-200 p-4 bg-white">
                    <div className="flex items-center justify-between">
                        <div>
                            {event.ticket_price > 0 ? (
                                <>
                                    <span className="text-2xl font-bold text-gray-900">₺{event.ticket_price}</span>
                                    {event.max_attendees && (
                                        <p className="text-xs text-gray-500">
                                            Son {event.max_attendees - attendeeCount} bilet
                                        </p>
                                    )}
                                </>
                            ) : (
                                <span className="text-lg font-semibold text-gray-700">Ücretsiz</span>
                            )}
                        </div>

                        {hasTicket || isAttending ? (
                            <div className="flex items-center gap-2 text-green-600">
                                <Ticket className="w-5 h-5" />
                                <span className="font-semibold">Katılıyorsunuz</span>
                            </div>
                        ) : (
                            <Button
                                onClick={handleBuyTicket}
                                disabled={loading}
                                className="h-11 px-6 rounded-xl bg-gray-900 hover:bg-black text-white font-semibold gap-2"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <Ticket className="w-4 h-4" />
                                        {event.ticket_price > 0 ? "Bilet Al" : "Ücretsiz Kayıt"}
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet >
    );
}
