"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

interface ZoomMeetingProps {
    meetingNumber: string;
    password: string;
    userName: string;
    userEmail: string;
    signature: string;
    sdkKey: string;
}

export function ZoomMeeting({
    meetingNumber,
    password,
    userName,
    userEmail,
    signature,
    sdkKey,
}: ZoomMeetingProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const initZoom = async () => {
            try {
                // Dynamic import for client-side only
                const ZoomMtgEmbedded = (await import("@zoom/meetingsdk/embedded"))
                    .default;

                const client = ZoomMtgEmbedded.createClient();

                if (!containerRef.current) return;

                await client.init({
                    zoomAppRoot: containerRef.current,
                    language: "tr-TR",
                    patchJsMedia: true,
                    leaveOnPageUnload: true,
                });

                await client.join({
                    sdkKey,
                    signature,
                    meetingNumber,
                    password,
                    userName,
                    userEmail,
                });

                setLoading(false);
            } catch (err) {
                console.error("Zoom error:", err);
                setError("Toplantıya bağlanılamadı. Lütfen tekrar deneyin.");
                setLoading(false);
            }
        };

        initZoom();
    }, [meetingNumber, password, userName, userEmail, signature, sdkKey]);

    if (error) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="text-center">
                    <p className="text-destructive">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative h-full w-full">
            {loading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-background">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                        <p className="text-sm text-muted-foreground">
                            Toplantıya bağlanılıyor...
                        </p>
                    </div>
                </div>
            )}
            <div
                ref={containerRef}
                className="h-full w-full"
                style={{ minHeight: "500px" }}
            />
        </div>
    );
}
