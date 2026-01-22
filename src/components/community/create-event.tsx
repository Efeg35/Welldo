"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useTransition } from "react";
import { createEvent } from "@/actions/events";
import { toast } from "sonner";
import { Loader2, Calendar as CalendarIcon, MapPin, Video, Layout } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Switch } from "@/components/ui/switch";
import { EventType } from "@/types";

interface CreateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    communityId: string;
    channelId: string;
}

export function CreateEventModal({ isOpen, onClose, communityId, channelId }: CreateEventModalProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [eventType, setEventType] = useState<EventType>("online_zoom");
    const [locationAddress, setLocationAddress] = useState("");
    const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [startTime, setStartTime] = useState("10:00");
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [endTime, setEndTime] = useState("11:00");
    const [isPaid, setIsPaid] = useState(false);
    const [ticketPrice, setTicketPrice] = useState("");

    // Topics (simulated for now as text input)
    const [topicsInput, setTopicsInput] = useState("");

    const [isPending, startTransition] = useTransition();

    const handleCreate = () => {
        if (!title || !startDate || !startTime || !endDate || !endTime) {
            toast.error("Lütfen gerekli alanları doldurun.");
            return;
        }

        const startDateTime = new Date(`${startDate}T${startTime}`);
        const endDateTime = new Date(`${endDate}T${endTime}`);

        if (endDateTime <= startDateTime) {
            toast.error("Bitiş zamanı başlangıç zamanından sonra olmalıdır.");
            return;
        }

        startTransition(async () => {
            try {
                await createEvent({
                    communityId,
                    channelId,
                    title,
                    description,
                    eventType,
                    locationAddress: eventType === 'physical' ? locationAddress : undefined,
                    startTime: startDateTime,
                    endTime: endDateTime,
                    isPaid,
                    ticketPrice: isPaid ? parseFloat(ticketPrice) : 0,
                    topics: topicsInput ? topicsInput.split(',').map(t => t.trim()) : [],
                });

                toast.success("Etkinlik başarıyla oluşturuldu.");
                onClose();
                // Reset form
                setTitle("");
                setDescription("");
                setEventType("online_zoom");
                setLocationAddress("");
                setIsPaid(false);
                setTicketPrice("");
                setTopicsInput("");
            } catch (error) {
                console.error(error);
                toast.error("Etkinlik oluşturulurken bir hata oluştu.");
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px] bg-background text-foreground border-border max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Etkinlik oluştur</DialogTitle>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Event Details */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            Etkinlik detayları neler?
                        </h3>

                        <div className="grid gap-2">
                            <Label htmlFor="title">Başlık</Label>
                            <Input
                                id="title"
                                placeholder="Örn: Cuma Soru-Cevap"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Açıklama</Label>
                            <Textarea
                                id="description"
                                placeholder="Etkinliğinizi anlatın..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Alan</Label>
                                <div className="p-2 border rounded-md bg-muted/50 text-sm text-muted-foreground cursor-not-allowed">
                                    Mevcut Alan
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Ev Sahibi</Label>
                                <div className="p-2 border rounded-md bg-muted/50 text-sm text-muted-foreground cursor-not-allowed">
                                    Sen
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="topics">Konular <span className="text-muted-foreground font-normal">(virgülle ayırın)</span></Label>
                            <Input
                                id="topics"
                                placeholder="En fazla 5 konu seçin"
                                value={topicsInput}
                                onChange={(e) => setTopicsInput(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="border-t pt-6 space-y-4">
                        <h3 className="font-semibold text-lg">Etkinlik ne zaman?</h3>

                        <div className="flex items-center gap-4">
                            <div className="grid gap-2 flex-1">
                                <Label>Başlangıç Tarihi</Label>
                                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                            </div>
                            <div className="grid gap-2 w-32">
                                <Label>Saat</Label>
                                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                            </div>
                            <span className="pt-6 text-muted-foreground">-</span>
                            <div className="grid gap-2 flex-1">
                                <Label>Bitiş Tarihi</Label>
                                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                            </div>
                            <div className="grid gap-2 w-32">
                                <Label>Saat</Label>
                                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                            </div>
                        </div>
                    </div>

                    <div className="border-t pt-6 space-y-4">
                        <h3 className="font-semibold text-lg">Etkinlik nerede?</h3>

                        <div className="grid gap-2">
                            <Label>Konum</Label>
                            <Select value={eventType} onValueChange={(val) => setEventType(val as EventType)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="online_zoom">
                                        <div className="flex items-center gap-2">
                                            <Video className="w-4 h-4" />
                                            <span>Online (Zoom/Link)</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="physical">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4" />
                                            <span>Fiziksel / Belirli Konum</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {eventType === 'physical' && (
                            <div className="grid gap-2 animate-in fade-in slide-in-from-top-2">
                                <Label>Adres / Mekan</Label>
                                <Input
                                    placeholder="Adresi girin..."
                                    value={locationAddress}
                                    onChange={(e) => setLocationAddress(e.target.value)}
                                />
                            </div>
                        )}
                    </div>

                    <div className="border-t pt-6 space-y-4">
                        <h3 className="font-semibold text-lg">Bu ücretli bir etkinlik mi?</h3>

                        <div className="flex items-center justify-between border p-4 rounded-lg">
                            <div className="space-y-0.5">
                                <Label className="text-base">Ücretli Etkinlik</Label>
                                <p className="text-sm text-muted-foreground">Katılım için bilet satın alma zorunluluğu</p>
                            </div>
                            <Switch checked={isPaid} onCheckedChange={setIsPaid} />
                        </div>

                        {isPaid && (
                            <div className="grid gap-2 animate-in fade-in slide-in-from-top-2">
                                <Label>Bilet Fiyatı</Label>
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    min="0"
                                    value={ticketPrice}
                                    onChange={(e) => setTicketPrice(e.target.value)}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={onClose} disabled={isPending}>İptal</Button>
                    <Button onClick={handleCreate} disabled={isPending} className="bg-[#1c1c1c] text-white hover:bg-black">
                        {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Oluştur
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
