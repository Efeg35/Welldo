import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    Calendar,
    MapPin,
    Video,
    Users,
    Clock,
    ArrowLeft,
    FileText,
    Download
} from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { EventActions } from "./event-actions";
import type { Event, Community, Ticket } from "@/types";

interface EventWithDetails extends Event {
    community: Community;
}

interface EventDetailPageProps {
    params: Promise<{ eventId: string }>;
}

export default async function EventDetailPage({
    params,
}: EventDetailPageProps) {
    const { eventId } = await params;
    const supabase = await createClient();

    // Get current user
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Fetch event
    const { data: event } = await supabase
        .from("events")
        .select(`*, community:communities(*)`)
        .eq("id", eventId)
        .single();

    if (!event) {
        notFound();
    }

    // Check if user has ticket
    let ticket: Ticket | null = null;
    if (user) {
        const { data } = await supabase
            .from("tickets")
            .select("*")
            .eq("event_id", eventId)
            .eq("user_id", user.id)
            .single();
        ticket = data as Ticket | null;
    }

    const eventData = event as EventWithDetails;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("tr-TR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString("tr-TR", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const isLive =
        new Date(eventData.start_time) <= new Date() &&
        new Date(eventData.end_time) >= new Date();

    return (
        <div className="flex flex-col pb-24">
            {/* Cover Image */}
            {eventData.cover_image_url && (
                <div className="relative aspect-video">
                    <img
                        src={eventData.cover_image_url}
                        alt={eventData.title}
                        className="h-full w-full object-cover"
                    />
                    <Link
                        href="/events"
                        className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-background/80 backdrop-blur-lg"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    {isLive && (
                        <Badge className="absolute right-4 top-4 animate-pulse bg-red-500">
                            🔴 CANLI
                        </Badge>
                    )}
                </div>
            )}

            {/* Content */}
            <div className="flex flex-col gap-6 px-4 py-6">
                {/* Header */}
                <div>
                    <Badge
                        variant={
                            eventData.event_type === "online_zoom" ? "default" : "secondary"
                        }
                        className="mb-2"
                    >
                        {eventData.event_type === "online_zoom" ? (
                            <>
                                <Video className="mr-1 h-3 w-3" />
                                Online Ders
                            </>
                        ) : (
                            <>
                                <MapPin className="mr-1 h-3 w-3" />
                                Fiziksel Etkinlik
                            </>
                        )}
                    </Badge>
                    <h1 className="text-2xl font-bold">{eventData.title}</h1>
                    <p className="text-sm text-muted-foreground">
                        {eventData.community?.name}
                    </p>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 rounded-xl bg-card p-4">
                        <Calendar className="h-5 w-5 text-violet-500" />
                        <div>
                            <p className="text-xs text-muted-foreground">Tarih</p>
                            <p className="text-sm font-medium">
                                {formatDate(eventData.start_time)}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl bg-card p-4">
                        <Clock className="h-5 w-5 text-violet-500" />
                        <div>
                            <p className="text-xs text-muted-foreground">Saat</p>
                            <p className="text-sm font-medium">
                                {formatTime(eventData.start_time)} -{" "}
                                {formatTime(eventData.end_time)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Location (for physical events) */}
                {eventData.event_type === "physical" && eventData.location_address && (
                    <div className="flex items-start gap-3 rounded-xl bg-card p-4">
                        <MapPin className="h-5 w-5 text-violet-500" />
                        <div>
                            <p className="text-xs text-muted-foreground">Konum</p>
                            <p className="text-sm font-medium">{eventData.location_address}</p>
                        </div>
                    </div>
                )}

                <Separator />

                {/* Description with Markdown & Video Embeds */}
                {eventData.description && (
                    <div>
                        <h2 className="mb-2 font-semibold">Açıklama</h2>
                        <div className="text-sm text-muted-foreground prose prose-sm max-w-none dark:prose-invert">
                            {(() => {
                                const parts = eventData.description.split(/\[VIDEO:\s*(.*?)\]/g);
                                return parts.map((part, index) => {
                                    if (part.startsWith('http')) {
                                        // Simple embed logic for YouTube/Vimeo
                                        let embedUrl = part;
                                        if (part.includes('youtube.com/watch?v=')) {
                                            embedUrl = part.replace('watch?v=', 'embed/');
                                        } else if (part.includes('youtu.be/')) {
                                            embedUrl = part.replace('youtu.be/', 'www.youtube.com/embed/');
                                        } else if (part.includes('vimeo.com/')) {
                                            embedUrl = part.replace('vimeo.com/', 'player.vimeo.com/video/');
                                        }

                                        return (
                                            <div key={index} className="aspect-video w-full my-4 rounded-lg overflow-hidden border border-border">
                                                <iframe
                                                    src={embedUrl}
                                                    title="Video Embed"
                                                    className="w-full h-full"
                                                    allowFullScreen
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                />
                                            </div>
                                        );
                                    } else {
                                        // Render Markdown
                                        return <ReactMarkdown key={index}>{part}</ReactMarkdown>;
                                    }
                                });
                            })()}
                        </div>
                    </div>
                )}

                {/* Attachments */}
                {eventData.attachments && eventData.attachments.length > 0 && (
                    <div className="mt-6">
                        <h2 className="mb-3 font-semibold text-lg">Ekli Dosyalar</h2>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {eventData.attachments.map((file: any, idx: number) => (
                                <a
                                    key={idx}
                                    href={file.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors group"
                                >
                                    <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate group-hover:underline">{file.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {file.size ? (file.size / 1024 / 1024).toFixed(2) + ' MB' : 'Dosya'}
                                        </p>
                                    </div>
                                    <Download className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Actions (Fixed Bottom) */}
            <EventActions
                event={eventData}
                ticket={ticket}
                isLive={isLive}
                userId={user?.id}
            />
        </div>
    );
}
