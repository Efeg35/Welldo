"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cancelEventResponse } from "@/actions/community";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Video, Ticket, Loader2, QrCode, Check, ChevronDown, X } from "lucide-react";
import type { Event } from "@/types";

interface EventActionsProps {
    event: Event;
    userResponse: { user_id: string; status: 'attending' | 'not_attending' } | null;
    isLive: boolean;
    userId?: string;
}

const formatDateStr = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d\d\d/g, "");
};

export function EventActions({
    event,
    userResponse,
    isLive,
    userId,
}: EventActionsProps) {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);

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
                // Free ticket created or existing ticket restored
                router.refresh();
            } else if (data.checkoutFormContent) {
                // Open Iyzico checkout in new div
                const checkoutDiv = document.createElement("div");
                checkoutDiv.innerHTML = data.checkoutFormContent;
                document.body.appendChild(checkoutDiv);
                // Execute iyzico scripts
                const scripts = checkoutDiv.getElementsByTagName("script");
                for (let i = 0; i < scripts.length; i++) {
                    const script = document.createElement("script");
                    script.text = scripts[i].innerText;
                    document.body.appendChild(script);
                }
            } else if (data.error) {
                alert(data.error);
            }
        } catch (error) {
            alert("Bir hata oluştu. Lütfen tekrar deneyin.");
        }

        setLoading(false);
    };

    const handleCancelRSVP = async () => {
        setLoading(true);
        try {
            await cancelEventResponse(event.id);
            setShowCancelDialog(false);
            router.refresh();
        } catch (error) {
            alert("İptal edilemedi.");
        } finally {
            setLoading(false);
        }
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
            <div className="w-full">
                <Button className="w-full" onClick={() => router.push("/login")}>
                    Katılmak için giriş yap
                </Button>
            </div>
        );
    }

    // Has RSVP attending response
    if (userResponse && userResponse.status === 'attending') {
        return (
            <div className="w-full space-y-3">
                {/* Join Zoom for online events */}
                {event.event_type === "online_zoom" && isLive && (
                    <Button
                        className="w-full gap-2 bg-violet-500 hover:bg-violet-600 mb-2"
                        onClick={handleJoinZoom}
                    >
                        <Video className="h-4 w-4" />
                        Derse Katıl
                    </Button>
                )}

                {/* Going Status Dropdown */}
                <div className="w-full">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full justify-between px-3 font-normal" disabled={loading}>
                                <span className="flex items-center gap-2">
                                    <div className="bg-green-500 rounded-full p-0.5">
                                        <Check className="h-3 w-3 text-white" />
                                    </div>
                                    <span className="font-semibold text-foreground">Katılıyor</span>
                                </span>
                                <ChevronDown className="h-4 w-4 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[--radix-dropdown-menu-trigger-width]">
                            {/* Physical Event Ticket QR */}
                            {event.event_type === "physical" && (
                                <DropdownMenuItem onSelect={() => setShowQR(true)}>
                                    <QrCode className="mr-2 h-4 w-4" />
                                    <span>Bileti Göster</span>
                                </DropdownMenuItem>
                            )}

                            {/* Cancel Option */}
                            <DropdownMenuItem
                                onSelect={(e) => {
                                    e.preventDefault();
                                    setShowCancelDialog(true);
                                }}
                                className="text-red-600 focus:text-red-600"
                            >
                                <X className="mr-2 h-4 w-4" />
                                <span>Katılmıyorum (Vazgeç)</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Cancel Confirmation Dialog */}
                    <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                        <AlertDialogContent className="w-[90%] sm:w-full">
                            <AlertDialogHeader>
                                <AlertDialogTitle>Katılımı İptal Et</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Bu etkinliğe katılımınızı iptal etmek istediğinize emin misiniz?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleCancelRSVP}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Evet, İptal Et"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>

                {/* QR Sheet (Hidden logic triggered by dropdown) */}
                {event.event_type === "physical" && (
                    <Sheet open={showQR} onOpenChange={setShowQR}>
                        <SheetContent side="bottom" className="h-auto">
                            <SheetHeader>
                                <SheetTitle>Etkinliğe Kayıtlısınız</SheetTitle>
                            </SheetHeader>
                            <div className="py-6 text-center">
                                <p className="text-muted-foreground mb-4">Bu fiziksel etkinliğe başarıyla kayıt oldunuz.</p>
                                <div className="flex justify-center">
                                    <div className="w-32 h-32 bg-gray-100 rounded flex items-center justify-center">
                                        <QrCode className="h-16 w-16 text-gray-400" />
                                        {/* Real QR would go here */}
                                    </div>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                )}
            </div>
        );
    }

    // No ticket - show buy button
    return (
        <div className="w-full space-y-4">
            {event.ticket_price > 0 && (
                <div className="bg-muted/50 p-3 rounded-lg text-center">
                    <span className="text-2xl font-bold text-violet-600">
                        ₺{event.ticket_price}
                    </span>
                </div>
            )}

            <Button
                className="w-full gap-2 bg-violet-600 hover:bg-violet-700 h-11"
                onClick={handleBuyTicket}
                disabled={loading}
            >
                {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <>
                        <Ticket className="h-4 w-4" />
                        {event.ticket_price > 0 ? "Bilet Al" : "Ücretsiz Kayıt"}
                    </>
                )}
            </Button>
        </div>
    );
}
