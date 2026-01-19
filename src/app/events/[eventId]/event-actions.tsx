"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { TicketQRCode } from "@/components/tickets";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Video, Ticket, Loader2, QrCode, Check } from "lucide-react";
import type { Event, Ticket as TicketType } from "@/types";

interface EventActionsProps {
    event: Event;
    ticket: TicketType | null;
    isLive: boolean;
    userId?: string;
}

export function EventActions({
    event,
    ticket,
    isLive,
    userId,
}: EventActionsProps) {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [showQR, setShowQR] = useState(false);

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

            if (data.free) {
                // Free ticket created
                router.refresh();
            } else if (data.checkoutFormContent) {
                // Open Iyzico checkout in new div
                const checkoutDiv = document.createElement("div");
                checkoutDiv.innerHTML = data.checkoutFormContent;
                document.body.appendChild(checkoutDiv);
                // Execute iyzico scripts
                const scripts = checkoutDiv.getElementsByTagName("script");
                for (let i = 0; i < scripts.length; i++) {
                    eval(scripts[i].innerText);
                }
            } else if (data.error) {
                alert(data.error);
            }
        } catch (error) {
            alert("Bir hata oluştu. Lütfen tekrar deneyin.");
        }

        setLoading(false);
    };

    const handleJoinZoom = async () => {
        if (!event.zoom_meeting_id) {
            alert("Zoom toplantı bilgisi bulunamadı");
            return;
        }

        // Redirect to Zoom meeting page
        router.push(`/events/${event.id}/live`);
    };

    // Not logged in
    if (!userId) {
        return (
            <div className="fixed bottom-20 left-0 right-0 border-t border-border bg-background/80 p-4 backdrop-blur-lg">
                <Button className="w-full" onClick={() => router.push("/login")}>
                    Katılmak için giriş yap
                </Button>
            </div>
        );
    }

    // Has ticket
    if (ticket) {
        return (
            <div className="fixed bottom-20 left-0 right-0 border-t border-border bg-background/80 p-4 backdrop-blur-lg">
                <div className="flex gap-3">
                    {/* Show QR for physical events */}
                    {event.event_type === "physical" && (
                        <Sheet open={showQR} onOpenChange={setShowQR}>
                            <SheetTrigger asChild>
                                <Button variant="outline" className="flex-1 gap-2">
                                    <QrCode className="h-4 w-4" />
                                    QR Kodu
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="bottom" className="h-auto">
                                <SheetHeader>
                                    <SheetTitle>Biletiniz</SheetTitle>
                                </SheetHeader>
                                <div className="py-6">
                                    <TicketQRCode
                                        token={ticket.qr_code_token}
                                        eventTitle={event.title}
                                    />
                                </div>
                            </SheetContent>
                        </Sheet>
                    )}

                    {/* Join Zoom for online events */}
                    {event.event_type === "online_zoom" && isLive && (
                        <Button
                            className="flex-1 gap-2 bg-violet-500 hover:bg-violet-600"
                            onClick={handleJoinZoom}
                        >
                            <Video className="h-4 w-4" />
                            Derse Katıl
                        </Button>
                    )}

                    {/* Not live yet */}
                    {event.event_type === "online_zoom" && !isLive && (
                        <Button className="flex-1 gap-2" disabled>
                            <Check className="h-4 w-4" />
                            Kayıtlısınız
                        </Button>
                    )}

                    {/* Physical event - already have ticket */}
                    {event.event_type === "physical" && (
                        <Button className="flex-1 gap-2" disabled>
                            <Check className="h-4 w-4" />
                            Biletiniz Mevcut
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    // No ticket - show buy button
    return (
        <div className="fixed bottom-20 left-0 right-0 border-t border-border bg-background/80 p-4 backdrop-blur-lg">
            <div className="flex items-center justify-between">
                <div>
                    <span className="text-2xl font-bold text-violet-500">
                        {event.ticket_price > 0 ? `₺${event.ticket_price}` : "Ücretsiz"}
                    </span>
                </div>
                <Button
                    className="gap-2 bg-violet-500 px-8 hover:bg-violet-600"
                    onClick={handleBuyTicket}
                    disabled={loading}
                >
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <>
                            <Ticket className="h-4 w-4" />
                            {event.ticket_price > 0 ? "Satın Al" : "Ücretsiz Kayıt"}
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
