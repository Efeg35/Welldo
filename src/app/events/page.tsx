import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Video, Users, ChevronRight } from "lucide-react";
import type { Event, Community } from "@/types";

interface EventWithCommunity extends Event {
    community: Community;
}

export default async function EventsPage() {
    const supabase = await createClient();

    const { data: events } = await supabase
        .from("events")
        .select(`*, community:communities(*)`)
        .gte("start_time", new Date().toISOString())
        .order("start_time", { ascending: true })
        .limit(20);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("tr-TR", {
            weekday: "short",
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="flex flex-col gap-6 px-4 py-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">Etkinlikler</h1>
                <p className="text-sm text-muted-foreground">
                    Yaklaşan canlı dersler ve etkinlikler
                </p>
            </div>

            {/* Events List */}
            <div className="flex flex-col gap-4">
                {(events as EventWithCommunity[])?.map((event) => (
                    <Link
                        key={event.id}
                        href={`/events/${event.id}`}
                        className="group overflow-hidden rounded-2xl bg-card transition-transform active:scale-[0.98]"
                    >
                        {/* Cover Image */}
                        {event.cover_image_url && (
                            <div className="relative aspect-video overflow-hidden">
                                <img
                                    src={event.cover_image_url}
                                    alt={event.title}
                                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                />
                                <Badge
                                    className="absolute left-3 top-3"
                                    variant={
                                        event.event_type === "online_zoom" ? "default" : "secondary"
                                    }
                                >
                                    {event.event_type === "online_zoom" ? (
                                        <>
                                            <Video className="mr-1 h-3 w-3" />
                                            Canlı
                                        </>
                                    ) : (
                                        <>
                                            <MapPin className="mr-1 h-3 w-3" />
                                            Fiziksel
                                        </>
                                    )}
                                </Badge>
                            </div>
                        )}

                        {/* Content */}
                        <div className="flex flex-col gap-2 p-4">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="font-semibold">{event.title}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {event.community?.name}
                                    </p>
                                </div>
                                {event.ticket_price > 0 && (
                                    <span className="text-lg font-bold text-violet-500">
                                        ₺{event.ticket_price}
                                    </span>
                                )}
                            </div>

                            {/* Meta Info */}
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(event.start_time)}
                                </span>
                                {event.location_address && (
                                    <span className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {event.location_address}
                                    </span>
                                )}
                                {event.max_attendees && (
                                    <span className="flex items-center gap-1">
                                        <Users className="h-3 w-3" />
                                        Max {event.max_attendees}
                                    </span>
                                )}
                            </div>
                        </div>
                    </Link>
                ))}

                {/* Empty State */}
                {(!events || events.length === 0) && (
                    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 py-16 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-500/10">
                            <Calendar className="h-8 w-8 text-violet-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">Henüz etkinlik yok</h2>
                            <p className="text-sm text-muted-foreground">
                                Yakında yeni etkinlikler eklenecek!
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
