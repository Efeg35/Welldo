"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useState, useTransition, useEffect } from "react";
import { createEvent } from "@/actions/events";
import { getCommunityChannels } from "@/actions/community";
import { toast } from "sonner";
import { Loader2, Calendar as CalendarIcon, MapPin, Video, User, X, Clock, HelpCircle, ChevronDown, Check } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { EventType } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface CreateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    communityId: string;
    channelId: string;
    currentUser?: {
        full_name?: string | null;
        avatar_url?: string | null;
        iyzico_sub_merchant_key?: string | null;
    };
}

export function CreateEventModal({ isOpen, onClose, communityId, channelId: initialChannelId, currentUser }: CreateEventModalProps) {
    // Section 1: What
    const [title, setTitle] = useState("");
    const [selectedChannelId, setSelectedChannelId] = useState(initialChannelId);
    const [channels, setChannels] = useState<{ id: string, name: string }[]>([]);

    // Load available channels
    useEffect(() => {
        if (isOpen && communityId) {
            getCommunityChannels(communityId, 'event').then((data: { id: string, name: string }[]) => {
                if (data) setChannels(data);
            });
        }
    }, [isOpen, communityId]);

    // Update selected channel if initial prop changes
    useEffect(() => {
        setSelectedChannelId(initialChannelId);
    }, [initialChannelId]);

    // Section 2: When
    const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [startTime, setStartTime] = useState("23:00"); // Matches screenshot default approx
    const [endDate, setEndDate] = useState(format(new Date(Date.now() + 3600000), 'yyyy-MM-dd')); // +1 hour
    const [endTime, setEndTime] = useState("00:00");
    const [repeatFrequency, setRepeatFrequency] = useState("none");

    // Section 3: Where
    const [eventType, setEventType] = useState<EventType>("online_zoom");
    const [locationAddress, setLocationAddress] = useState("");
    const [eventUrl, setEventUrl] = useState("");

    // WellDo Live Stream settings (MVP)
    const [recordLive, setRecordLive] = useState(false);
    const [muteParticipants, setMuteParticipants] = useState(false);
    const [disableChat, setDisableChat] = useState(false);
    const [hideParticipantsList, setHideParticipantsList] = useState(false);

    // Section 4: Paid
    const [isPaidEvent, setIsPaidEvent] = useState("free"); // "free" | "paid"
    const [ticketPrice, setTicketPrice] = useState("");

    const [isPending, startTransition] = useTransition();

    // Generate time options (00:00 to 23:30)
    const timeOptions = Array.from({ length: 48 }, (_, i) => {
        const hour = Math.floor(i / 2);
        const minute = i % 2 === 0 ? "00" : "30";
        return `${hour.toString().padStart(2, "0")}:${minute}`;
    });

    const handleStartDateSelect = (date: Date | undefined) => {
        if (!date) return;
        const newStartDateStr = format(date, 'yyyy-MM-dd');
        setStartDate(newStartDateStr);

        // Auto-sync end date to be same as start date initially
        setEndDate(newStartDateStr);
    };

    const handleStartTimeChange = (newTime: string) => {
        setStartTime(newTime);
        // Auto-sync end time to match start time initially if dates are same
        if (startDate === endDate) {
            setEndTime(newTime);
        }
    };

    const handleCreate = () => {
        if (!title || !startDate || !startTime || !endDate || !endTime) {
            toast.error("Lütfen tüm gerekli alanları doldurun.");
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
                const isPaid = isPaidEvent === "paid";

                await createEvent({
                    communityId,
                    channelId: selectedChannelId,
                    title,
                    description: "",
                    eventType,
                    locationAddress: eventType === 'physical' ? locationAddress : undefined,
                    eventUrl: eventType === 'online_zoom' ? eventUrl : undefined,
                    liveStreamSettings: eventType === 'welldo_live' ? {
                        recordLive,
                        muteParticipants,
                        disableChat,
                        hideParticipantsList,
                    } : undefined,
                    startTime: startDateTime,
                    endTime: endDateTime,
                    isPaid,
                    ticketPrice: isPaid ? parseFloat(ticketPrice) : 0,
                    recurrence: repeatFrequency,
                });

                toast.success("Etkinlik başarıyla oluşturuldu!");
                onClose();

                // Reset form
                setTitle("");
                setEventType("online_zoom");
                setLocationAddress("");
                setEventUrl("");
                setIsPaidEvent("free");
                setTicketPrice("");
            } catch (error) {
                console.error(error);
                toast.error("Etkinlik oluşturulurken bir hata oluştu");
            }
        });
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="bottom" className="h-[95vh] p-0 rounded-t-xl overflow-hidden flex flex-col gap-0 border-none shadow-2xl bg-white">
                <SheetHeader className="px-6 md:px-12 py-5 border-b border-gray-100 bg-white sticky top-0 z-10 text-left">
                    <div className="max-w-3xl mx-auto w-full">
                        <SheetTitle className="text-xl font-bold text-gray-900">
                            Etkinlik oluştur
                        </SheetTitle>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto bg-white p-6 md:p-12">
                    <div className="max-w-3xl mx-auto space-y-12 pb-20 pt-4">

                        {/* 1. Etkinlik nedir? */}
                        <section className="space-y-6">
                            <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">Etkinlik nedir?</h3>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-base font-bold text-gray-900">Başlık</Label>
                                    <Input
                                        placeholder="Etkinlik başlığı giriniz"
                                        className="h-11 text-base px-4 bg-white border-gray-300 focus:border-gray-900 focus:ring-0 rounded-md transition-all placeholder:text-gray-400 font-normal"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-base font-bold text-gray-900">Alan</Label>
                                    <Select value={selectedChannelId} onValueChange={setSelectedChannelId}>
                                        <SelectTrigger className="flex items-center justify-between h-11 px-4 bg-white border border-gray-300 rounded-md text-gray-900 cursor-pointer hover:border-gray-400 transition-colors w-full text-base">
                                            <SelectValue placeholder="Bir alan seçin" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {channels.map((channel) => (
                                                <SelectItem key={channel.id} value={channel.id} className="text-base">
                                                    {channel.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </section>

                        {/* 2. Etkinlik ne zaman? */}
                        <section className="space-y-6">
                            <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">Etkinlik ne zaman?</h3>

                            <div className="space-y-4">
                                <div className="space-y-3">
                                    <Label className="text-base font-bold text-gray-900">Tarih & Saat</Label>
                                    <div className="flex flex-col lg:flex-row items-center gap-4">
                                        {/* Start Date & Time Group */}
                                        <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:w-auto flex-1 group">
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            "w-full sm:w-[220px] justify-start text-left font-normal h-11 border-gray-300 rounded-lg hover:border-gray-900 transition-colors",
                                                            !startDate && "text-muted-foreground"
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                                                        <span className="flex-1 truncate">
                                                            {startDate ? format(new Date(startDate), "d MMMM yyyy", { locale: tr }) : "Tarih seçin"}
                                                        </span>
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-xl overflow-hidden" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={startDate ? new Date(startDate) : undefined}
                                                        onSelect={handleStartDateSelect}
                                                        initialFocus
                                                        locale={tr}
                                                    />
                                                </PopoverContent>
                                            </Popover>

                                            <Select value={startTime} onValueChange={handleStartTimeChange}>
                                                <SelectTrigger className="w-full sm:w-[120px] h-11 border-gray-300 rounded-lg hover:border-gray-900 transition-colors bg-white">
                                                    <div className="flex items-center">
                                                        <Clock className="w-4 h-4 mr-2 text-gray-500" />
                                                        <SelectValue placeholder="Saat" />
                                                    </div>
                                                </SelectTrigger>
                                                <SelectContent className="max-h-[240px] rounded-lg">
                                                    {timeOptions.map((time) => (
                                                        <SelectItem key={`start-${time}`} value={time} className="text-base py-3">
                                                            {time}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="hidden lg:flex items-center justify-center">
                                            <div className="h-px w-4 bg-gray-200" />
                                            <span className="mx-1 text-gray-400">den</span>
                                            <div className="h-px w-4 bg-gray-200" />
                                        </div>

                                        {/* End Date & Time Group */}
                                        <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:w-auto flex-1">
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            "w-full sm:w-[220px] justify-start text-left font-normal h-11 border-gray-300 rounded-lg hover:border-gray-900 transition-colors",
                                                            !endDate && "text-muted-foreground"
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                                                        <span className="flex-1 truncate">
                                                            {endDate ? format(new Date(endDate), "d MMMM yyyy", { locale: tr }) : "Tarih seçin"}
                                                        </span>
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-xl overflow-hidden" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={endDate ? new Date(endDate) : undefined}
                                                        onSelect={(date) => date && setEndDate(format(date, 'yyyy-MM-dd'))}
                                                        initialFocus
                                                        disabled={(date) => date < new Date(startDate)}
                                                        locale={tr}
                                                    />
                                                </PopoverContent>
                                            </Popover>

                                            <Select value={endTime} onValueChange={setEndTime}>
                                                <SelectTrigger className="w-full sm:w-[120px] h-11 border-gray-300 rounded-lg hover:border-gray-900 transition-colors bg-white">
                                                    <div className="flex items-center">
                                                        <Clock className="w-4 h-4 mr-2 text-gray-500" />
                                                        <SelectValue placeholder="Saat" />
                                                    </div>
                                                </SelectTrigger>
                                                <SelectContent className="max-h-[240px] rounded-lg">
                                                    {timeOptions.map((time) => (
                                                        <SelectItem key={`end-${time}`} value={time} className="text-base py-3">
                                                            {time}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-base font-bold text-gray-900">Tekrar</Label>
                                    <Select value={repeatFrequency} onValueChange={setRepeatFrequency}>
                                        <SelectTrigger className="h-11 w-full md:w-[480px] bg-white border-gray-300 focus:ring-0 focus:border-gray-900 rounded-md text-gray-900 text-base">
                                            <SelectValue placeholder="Tekrar etmez" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none" className="text-base">Tekrar etmez</SelectItem>
                                            <SelectItem value="daily" className="text-base">Her gün</SelectItem>
                                            <SelectItem value="weekdays" className="text-base">Hafta içi her gün</SelectItem>
                                            <SelectItem value="weekly" className="text-base">Her hafta</SelectItem>
                                            <SelectItem value="biweekly" className="text-base">2 haftada bir</SelectItem>
                                            <SelectItem value="monthly" className="text-base">Aylık</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </section>

                        {/* 3. Etkinlik nerede? */}
                        <section className="space-y-6">
                            <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">Etkinlik nerede?</h3>

                            <div className="space-y-2">
                                <Label className="text-base font-bold text-gray-900">Konum</Label>
                                <Select value={eventType} onValueChange={(val) => setEventType(val as EventType)}>
                                    <SelectTrigger className="h-11 bg-white border-gray-300 focus:ring-0 focus:border-gray-900 rounded-md text-gray-900 w-full text-base">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="physical" className="text-base">
                                            <div className="flex items-center gap-2">
                                                <span>Yüz yüze</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="online_zoom" className="text-base">
                                            <div className="flex items-center gap-2">
                                                <span>Bağlantı (Zoom, YouTube vb.)</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="welldo_live" className="text-base">
                                            <div className="flex items-center gap-2">
                                                <span>WellDo Canlı Yayın</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="tbd" className="text-base">
                                            <div className="flex items-center gap-2">
                                                <span>Henüz belli değil (TBD)</span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {eventType === 'physical' && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <Label className="text-base font-bold text-gray-900">Adres / Mekan</Label>
                                    <Input
                                        placeholder="Tam adresi girin..."
                                        className="h-11 bg-white border-gray-300 focus:border-gray-900 focus:ring-0 rounded-md text-base"
                                        value={locationAddress}
                                        onChange={(e) => setLocationAddress(e.target.value)}
                                    />
                                </div>
                            )}

                            {eventType === 'online_zoom' && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <Label className="text-base font-bold text-gray-900">Bağlantı</Label>
                                    <Input
                                        placeholder="https://"
                                        className="h-11 bg-white border-gray-300 focus:border-gray-900 focus:ring-0 rounded-md text-base"
                                        value={eventUrl}
                                        onChange={(e) => setEventUrl(e.target.value)}
                                    />
                                </div>
                            )}

                            {eventType === 'welldo_live' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                    <div className="space-y-3 pt-2">
                                        <div className="flex items-start justify-between py-3 border-b border-gray-100">
                                            <div className="flex-1 pr-4">
                                                <Label className="text-base font-medium text-gray-900 cursor-pointer block">⏺️ Canlı yayını kaydet (30 Günlük)</Label>
                                                <p className="text-sm text-gray-500 mt-1">Yayın bittikten sonra kayıt otomatik olarak derslere eklenir ve 30 gün boyunca izlenebilir. Sonrasında silinir.</p>
                                            </div>
                                            <Switch checked={recordLive} onCheckedChange={setRecordLive} />
                                        </div>
                                        <div className="flex items-start justify-between py-3 border-b border-gray-100">
                                            <div className="flex-1 pr-4">
                                                <Label className="text-base font-medium text-gray-900 cursor-pointer block">🔇 Katılımcılar sessiz başlasın</Label>
                                                <p className="text-sm text-gray-500 mt-1">Odaya girenlerin mikrofonu kapalı olur.</p>
                                            </div>
                                            <Switch checked={muteParticipants} onCheckedChange={setMuteParticipants} />
                                        </div>
                                        <div className="flex items-start justify-between py-3 border-b border-gray-100">
                                            <div className="flex-1 pr-4">
                                                <Label className="text-base font-medium text-gray-900 cursor-pointer block">💬 Sohbeti devre dışı bırak</Label>
                                                <p className="text-sm text-gray-500 mt-1">Yayın sırasında chat penceresi gizlenir.</p>
                                            </div>
                                            <Switch checked={disableChat} onCheckedChange={setDisableChat} />
                                        </div>
                                        <div className="flex items-start justify-between py-3">
                                            <div className="flex-1 pr-4">
                                                <Label className="text-base font-medium text-gray-900 cursor-pointer block">🙈 Katılımcı listesini gizle</Label>
                                                <p className="text-sm text-gray-500 mt-1">Katılımcılar birbirlerini göremez.</p>
                                            </div>
                                            <Switch checked={hideParticipantsList} onCheckedChange={setHideParticipantsList} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* 4. Bu ücretli bir etkinlik mi? */}
                        <section className="space-y-6">
                            <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">Bu ücretli bir etkinlik mi?</h3>

                            <div className="space-y-2">
                                <Label className="text-base font-bold text-gray-900">Kayıt</Label>
                                <Select value={isPaidEvent} onValueChange={setIsPaidEvent}>
                                    <SelectTrigger className="h-11 bg-white border-gray-300 focus:ring-0 focus:border-gray-900 rounded-md text-gray-900 w-full text-base">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="free" className="text-base">Ücretsiz etkinlik</SelectItem>
                                        <SelectItem value="paid" className="text-base">Ücretli etkinlik</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {isPaidEvent === 'paid' && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                    {currentUser?.iyzico_sub_merchant_key ? (
                                        <>
                                            <Label className="text-base font-bold text-gray-900">Bilet Fiyatı</Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-3 text-gray-500 font-medium text-base">₺</span>
                                                <Input
                                                    type="number"
                                                    placeholder="0.00"
                                                    min="0"
                                                    className="pl-8 h-11 bg-white border-gray-300 focus:border-gray-900 focus:ring-0 rounded-md w-48 text-base"
                                                    value={ticketPrice}
                                                    onChange={(e) => setTicketPrice(e.target.value)}
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-center gap-3 transition-all hover:bg-gray-100/50">
                                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-gray-200 shadow-sm mb-1">
                                                <HelpCircle className="w-6 h-6 text-gray-400" />
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="text-base font-bold text-gray-900">Ödeme almaya başlayın</h4>
                                                <p className="text-sm text-gray-500 max-w-xs mx-auto">
                                                    Ücretli etkinlik oluşturmak için ödeme bilgilerinizi doğrulamanız gerekiyor.
                                                </p>
                                            </div>
                                            <Button
                                                variant="default"
                                                className="mt-2 bg-gray-900 text-white hover:bg-black rounded-lg px-6"
                                                onClick={() => window.open('/dashboard/settings/payouts', '_blank')}
                                            >
                                                Hesabımı Bağla
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </section>
                    </div>
                </div>

                <div className="p-4 md:px-12 md:py-5 border-t border-gray-100 bg-white flex justify-end gap-3 sticky bottom-0 z-10">
                    <Button variant="outline" onClick={onClose} className="h-10 px-6 rounded-full border-gray-300 text-gray-700 font-medium hover:bg-gray-50">
                        İptal
                    </Button>
                    <Button
                        onClick={handleCreate}
                        disabled={isPending}
                        className="h-10 px-6 rounded-full bg-gray-900 text-white hover:bg-black shadow-none font-medium"
                    >
                        {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Taslağı kaydet
                    </Button>
                </div>
            </SheetContent >
        </Sheet >
    );
}
