"use client";

import { Calendar, MapPin, Video, Clock, Users, Bookmark, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cn, getInitials } from "@/lib/utils";
import Link from "next/link";
import { setEventResponse, toggleEventBookmark } from "@/actions/events";
import { toast } from "sonner";
import { useState, useTransition } from "react";

interface FeedEventCardProps {
    event: any;
    currentUserId?: string;
}

export function FeedEventCard({ event, currentUserId }: FeedEventCardProps) {
    const [isPending, startTransition] = useTransition();
    const [isAttending, setIsAttending] = useState(event.isAttending || false);
    const [isBookmarked, setIsBookmarked] = useState(
        event.bookmarks?.some((b: any) => b.user_id === currentUserId) || false
    );

    const startDate = new Date(event.start_time);
    const dayNumber = format(startDate, "d");
    const monthName = format(startDate, "MMM", { locale: tr }).toUpperCase();
    const timeString = format(startDate, "HH:mm", { locale: tr });

    const handleRSVP = () => {
        if (!currentUserId) {
            toast.error("Bu işlem için giriş yapmalısınız");
            return;
        }

        startTransition(async () => {
            try {
                if (isAttending) {
                    await import("@/actions/community").then(mod => mod.cancelEventResponse(event.id));
                    setIsAttending(false);
                    toast.success("Katılım iptal edildi");
                } else {
                    await setEventResponse(event.id, 'attending');
                    setIsAttending(true);
                    toast.success("Katılım onaylandı!");
                }
            } catch (error) {
                toast.error("Bir hata oluştu");
            }
        });
    };

    const handleBookmark = () => {
        if (!currentUserId) {
            toast.error("Bu işlem için giriş yapmalısınız");
            return;
        }

        startTransition(async () => {
            try {
                await toggleEventBookmark(event.id);
                setIsBookmarked(!isBookmarked);
            } catch (error) {
                toast.error("Bir hata oluştu");
            }
        });
    };

    const getLocationDisplay = () => {
        if (event.event_type === 'online' || event.event_type === 'live_room') {
            return { icon: Video, text: "Online Etkinlik" };
        }
        return {
            icon: MapPin,
            text: event.location_address || "Konum belirtilmedi"
        };
    };

    const location = getLocationDisplay();
    const LocationIcon = location.icon;

    return (
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            {/* Cover Image */}
            {event.cover_image_url && (
                <Link href={`/events/${event.id}`}>
                    <div className="w-full h-48 relative">
                        <img
                            src={event.cover_image_url}
                            alt={event.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    </div>
                </Link>
            )}

            <div className="p-5">
                {/* Header: Channel Info */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-0 font-medium">
                            <Calendar className="w-3 h-3 mr-1" />
                            Etkinlik
                        </Badge>
                        {event.channel && (
                            <span>
                                • <Link href={`/community/${event.channel.slug}`} className="hover:underline">{event.channel.name}</Link>
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn("h-8 w-8", isBookmarked && "text-gray-900")}
                            onClick={handleBookmark}
                            disabled={isPending}
                        >
                            <Bookmark className={cn("w-4 h-4", isBookmarked && "fill-current")} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                            <MoreHorizontal className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex gap-4">
                    {/* Date Box */}
                    <div className="flex-shrink-0 w-14 h-14 bg-gray-50 rounded-lg flex flex-col items-center justify-center border border-gray-200">
                        <span className="text-xs font-bold text-gray-500">{monthName}</span>
                        <span className="text-xl font-bold text-gray-900">{dayNumber}</span>
                    </div>

                    {/* Event Info */}
                    <div className="flex-1 min-w-0">
                        <Link href={`/events/${event.id}`}>
                            <h3 className="font-bold text-lg text-gray-900 hover:text-gray-700 transition-colors line-clamp-2">
                                {event.title}
                            </h3>
                        </Link>

                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4" />
                                <span>{timeString}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <LocationIcon className="w-4 h-4" />
                                <span className="truncate max-w-[150px]">{location.text}</span>
                            </div>
                        </div>
                    </div>

                    {/* RSVP Button */}
                    <div className="flex-shrink-0 self-center">
                        <Button
                            variant={isAttending ? "secondary" : "default"}
                            size="sm"
                            className={cn(
                                "rounded-full font-medium",
                                isAttending
                                    ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    : "bg-gray-900 text-white hover:bg-gray-800"
                            )}
                            onClick={handleRSVP}
                            disabled={isPending}
                        >
                            {isPending ? "..." : isAttending ? "Katılındı ✓" : "Katıl"}
                        </Button>
                    </div>
                </div>

                {/* Attendee Count */}
                {event._count?.responses > 0 && (
                    <div className="flex items-center gap-1.5 mt-4 text-xs text-muted-foreground">
                        <Users className="w-3.5 h-3.5" />
                        <span>{event._count.responses} kişi katılıyor</span>
                    </div>
                )}
            </div>
        </div>
    );
}
