
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
import { getComments, getLikes } from "@/actions/community";
import { CommentList } from "@/components/community/comment-list";
import { CreateComment } from "@/components/community/create-comment";
import { EventActions } from "./event-actions";
import { AttendeeList } from "./attendee-list";
import { EventLikeButton } from "@/components/community/event-like-button";
import type { Event, Community } from "@/types";

interface EventWithDetails extends Event {
    community: Community;
    channel?: {
        id: string;
        name: string;
        slug: string;
    };
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

    // Fetch event with responses
    const { data: event } = await supabase
        .from("events")
        .select(`
            *, 
            community:communities(*), 
            channel:channels(*),
            responses:event_responses(user_id, status)
        `)
        .eq("id", eventId)
        .single();

    if (!event) {
        notFound();
    }

    // Fetch comments
    const comments = await getComments(eventId, 'event');

    // Fetch likes
    const { count: likesCount, isLiked } = await getLikes(eventId, 'event');

    // Check if user has RSVP response
    let userResponse: { user_id: string; status: 'attending' | 'not_attending' } | null = null;
    if (user && event) {
        userResponse = (event as any).responses?.find(
            (r: any) => r.user_id === user.id && r.status === 'attending'
        ) || null;
    }

    const eventData = event as EventWithDetails;

    // Check if live
    const isLive =
        new Date(eventData.start_time) <= new Date() &&
        new Date(eventData.end_time) >= new Date();

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString("tr-TR", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        });
    };

    return (
        <div className="container mx-auto max-w-6xl px-4 py-6">
            {/* Back Link */}
            <div className="mb-6">
                <Link
                    href={`/community/${eventData.channel?.slug || eventData.community?.slug || ''}`}
                    className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {eventData.channel ? `${eventData.channel.name} kanalına dön` : (eventData.community?.name || 'Topluluğa') + ' sayfasına dön'}
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                {/* LEFT COLUMN - Main Content */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Event Main Card */}
                    <div className="bg-card rounded-xl border border-border p-8 shadow-sm">

                        {/* Title & Host Meta */}
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold mb-4">{eventData.title}</h1>

                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center font-bold text-sm">
                                    {eventData.community?.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide">DÜZENLEYEN</p>
                                    <p className="text-sm font-semibold">{eventData.community?.name}</p>
                                </div>
                            </div>
                        </div>

                        {/* Cover Image (if exists) */}
                        {eventData.cover_image_url && (
                            <div className="mb-8 rounded-lg overflow-hidden border border-border aspect-video relative">
                                <img
                                    src={eventData.cover_image_url}
                                    alt={eventData.title}
                                    className="h-full w-full object-cover"
                                />
                                {isLive && (
                                    <Badge className="absolute right-4 top-4 animate-pulse bg-red-500 hover:bg-red-500 border-none text-white">
                                        🔴 CANLI
                                    </Badge>
                                )}
                            </div>
                        )}

                        {/* Description */}
                        {eventData.description && (
                            <div className="prose prose-sm max-w-none dark:prose-invert mb-8 text-foreground/90">
                                <ReactMarkdown>{eventData.description}</ReactMarkdown>
                            </div>
                        )}

                        {/* Attachments */}
                        {eventData.attachments && eventData.attachments.length > 0 && (
                            <div className="mb-8">
                                <h3 className="font-semibold text-sm mb-3">Ekler</h3>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {eventData.attachments.map((file: any, idx: number) => (
                                        <a
                                            key={idx}
                                            href={file.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors group"
                                        >
                                            <div className="h-8 w-8 flex items-center justify-center rounded bg-muted text-muted-foreground">
                                                <FileText className="h-4 w-4" />
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

                        {/* Interaction Bar & Comments Header */}
                        <div className="border-t border-border pt-6 mt-8">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex gap-6">
                                    {/* Like Component */}
                                    <EventLikeButton
                                        eventId={eventId}
                                        initialLikes={likesCount}
                                        initialIsLiked={isLiked}
                                        userId={user?.id}
                                    />

                                    {/* Comment Count - Static for display */}
                                    <div className="flex items-center gap-2 text-muted-foreground group cursor-pointer hover:text-foreground transition-colors">
                                        <svg width="20" height="20" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:scale-110 transition-transform"><path d="M2.5 5.5C2.5 3.84315 4.73858 2.5 7.5 2.5C10.2614 2.5 12.5 3.84315 12.5 5.5C12.5 7.15685 10.2614 8.5 7.5 8.5C6.88581 8.5 6.29742 8.43444 5.75053 8.31298C5.2327 8.69466 4.54226 9.00699 3.73881 9.17647C3.54148 9.2181 3.35121 9.07172 3.36531 8.87037C3.39801 8.40348 3.5113 7.9945 3.67056 7.64969C2.94639 7.0863 2.5 6.33535 2.5 5.5Z" stroke="currentColor" fill="none"></path></svg>
                                        <span className="text-sm font-medium">{comments?.length || 0} yorum</span>
                                    </div>
                                </div>

                                <div className="text-sm text-muted-foreground">
                                    {comments?.length || 0} yorum
                                </div>
                            </div>

                            {/* Comments Section - Embedded */}
                            {(!eventData.settings?.permissions?.comments_disabled) && (
                                <div className="space-y-6">
                                    {/* Comment List IS NOW FIRST */}
                                    <div className="space-y-4">
                                        {comments && comments.length > 0 ? (
                                            <CommentList comments={comments} />
                                        ) : (
                                            <div className="text-center py-8 text-muted-foreground bg-accent/20 rounded-md border border-border/50 border-dashed">
                                                Henüz yorum yok. Düşüncelerini paylaşan ilk kişi sen ol!
                                            </div>
                                        )}
                                    </div>

                                    {/* Create Comment IS NOW LAST */}
                                    {user && (
                                        <div className="mt-6 pt-6 border-t border-border">
                                            <CreateComment eventId={eventId} user={user} />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>


                {/* RIGHT COLUMN - Sticky Sidebar */}
                <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-6">

                    {/* Date/Time/Action Card */}
                    <div className="bg-card rounded-xl border border-border p-6 shadow-sm">

                        <div className="flex gap-4 items-start mb-6">
                            {/* Date Box */}
                            <div className="flex flex-col items-center justify-center w-14 h-14 border border-border/60 bg-accent/20 rounded-lg shrink-0 shadow-sm">
                                <span className="text-xs font-bold uppercase text-muted-foreground">
                                    {new Date(eventData.start_time).toLocaleDateString('tr-TR', { month: 'short' }).toUpperCase()}
                                </span>
                                <span className="text-xl font-bold">
                                    {new Date(eventData.start_time).getDate()}
                                </span>
                            </div>

                            <div className="space-y-1">
                                <p className="font-semibold text-[15px]">
                                    {new Date(eventData.start_time).toLocaleDateString('tr-TR', { weekday: 'long', month: 'long', day: 'numeric' })}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {formatTime(new Date(eventData.start_time))} - {formatTime(new Date(eventData.end_time))}
                                </p>
                            </div>
                        </div>

                        {/* Actions (Join / RSVP / Going) */}
                        <div className="mb-4">
                            <EventActions
                                event={eventData}
                                userResponse={userResponse}
                                isLive={isLive}
                                userId={user?.id}
                            />
                        </div>

                        {/* Add to Calendar */}
                        <a
                            href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventData.title)}&dates=${new Date(eventData.start_time).toISOString().replace(/-|:|\.\d\d\d/g, "")}/${new Date(eventData.end_time).toISOString().replace(/-|:|\.\d\d\d/g, "")}&details=${encodeURIComponent(eventData.description || '')}&location=${encodeURIComponent(eventData.location_address || eventData.zoom_meeting_id || '')}&sf=true&output=xml`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex w-full items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground h-10 border-border/60 text-muted-foreground"
                        >
                            <Calendar className="h-4 w-4" />
                            Takvime Ekle
                        </a>
                    </div>

                    {/* Location Card (if physical) */}
                    {eventData.event_type === 'physical' && eventData.location_address && (
                        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                            <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                                <MapPin className="h-4 w-4 text-muted-foreground" /> Konum
                            </h3>
                            <p className="text-sm text-muted-foreground">{eventData.location_address}</p>
                        </div>
                    )}

                    {/* Attendees Preview */}
                    {(!eventData.settings?.permissions?.hide_attendees || (user && eventData.organizer_id === user.id)) && (
                        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4 border-b border-border/60 pb-3">
                                <h3 className="font-semibold text-xs uppercase text-muted-foreground tracking-wider">Katılımcılar</h3>
                                <div className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                                    {(eventData as any).responses?.filter((r: any) => r.status === 'attending').length || 0}
                                </div>
                            </div>

                            <AttendeeList responses={(eventData as any).responses} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
