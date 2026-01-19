"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers";
import { ZoomMeeting } from "@/components/zoom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

interface ZoomPageProps {
    params: Promise<{ eventId: string }>;
}

export default function ZoomLivePage({ params }: ZoomPageProps) {
    const [eventId, setEventId] = useState<string | null>(null);
    const [event, setEvent] = useState<any>(null);
    const [zoomData, setZoomData] = useState<{
        signature: string;
        sdkKey: string;
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const router = useRouter();
    const supabase = createClient();
    const { user } = useAuth();

    // Resolve params
    useEffect(() => {
        params.then((p) => setEventId(p.eventId));
    }, [params]);

    // Fetch event and Zoom signature
    useEffect(() => {
        if (!eventId || !user) return;

        const fetchData = async () => {
            // Get event
            const { data: eventData, error: eventError } = await supabase
                .from("events")
                .select("*")
                .eq("id", eventId)
                .single();

            if (eventError || !eventData) {
                setError("Etkinlik bulunamadı");
                setLoading(false);
                return;
            }

            setEvent(eventData);

            // Check ticket
            const { data: ticket } = await supabase
                .from("tickets")
                .select("*")
                .eq("event_id", eventId)
                .eq("user_id", user.id)
                .single();

            if (!ticket) {
                setError("Bu etkinliğe biletiniz yok");
                setLoading(false);
                return;
            }

            // Get Zoom signature
            if (eventData.zoom_meeting_id) {
                const res = await fetch("/api/zoom/signature", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        meetingNumber: eventData.zoom_meeting_id,
                        role: 0, // attendee
                    }),
                });

                if (res.ok) {
                    const data = await res.json();
                    setZoomData(data);
                } else {
                    setError("Zoom bağlantısı kurulamadı");
                }
            } else {
                setError("Zoom toplantı bilgisi yok");
            }

            setLoading(false);
        };

        fetchData();
    }, [eventId, user, supabase]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                    <p className="text-sm text-muted-foreground">Yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4 px-4">
                <p className="text-destructive">{error}</p>
                <Button variant="outline" onClick={() => router.back()}>
                    Geri Dön
                </Button>
            </div>
        );
    }

    if (!zoomData || !event || !user) {
        return null;
    }

    return (
        <div className="flex h-screen flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border bg-background px-4 py-3">
                <Link
                    href={`/events/${eventId}`}
                    className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="font-semibold">{event.title}</h1>
                    <p className="text-xs text-muted-foreground">Canlı Ders</p>
                </div>
            </div>

            {/* Zoom Meeting */}
            <div className="flex-1">
                <ZoomMeeting
                    meetingNumber={event.zoom_meeting_id}
                    password={event.zoom_password || ""}
                    userName={user.user_metadata?.full_name || user.email || "Katılımcı"}
                    userEmail={user.email || ""}
                    signature={zoomData.signature}
                    sdkKey={zoomData.sdkKey}
                />
            </div>
        </div>
    );
}
