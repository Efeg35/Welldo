"use client";

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useTransition, useEffect } from "react";
import { updateEvent, publishEvent, unpublishEvent, getEvent, getEventStats } from "@/actions/events";
import { getCommunityChannels } from "@/actions/community";
import { toast } from "sonner";
import { Loader2, X, MoreHorizontal, Calendar as CalendarIcon, Clock, HelpCircle, Settings, ArrowUpRight, Copy, Eye, Users, User } from "lucide-react";
import { Event, EventStatus, EventType } from "@/types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface EditEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventId: string;
    communityId: string;
    currentUser?: {
        full_name?: string | null;
        avatar_url?: string | null;
        iyzico_sub_merchant_key?: string | null;
    };
}

export function EditEventModal({ isOpen, onClose, eventId, communityId, currentUser }: EditEventModalProps) {
    const [activeTab, setActiveTab] = useState("basic_info");
    const [event, setEvent] = useState<Event | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<{ attendeeCount: number, latestAttendees: any[] } | null>(null);
    const [isSaving, startTransition] = useTransition();

    // Fetch stats when Overview tab is active
    useEffect(() => {
        if (isOpen && eventId && activeTab === 'overview') {
            getEventStats(eventId).then((data) => {
                setStats(data);
            });
        }
    }, [isOpen, eventId, activeTab]);

    const handleTogglePublish = () => {
        if (!event) return;
        startTransition(async () => {
            try {
                if (event.status === 'published') {
                    await unpublishEvent(eventId);
                    toast.success("Etkinlik yayından kaldırıldı (Taslak)");
                    setEvent({ ...event, status: 'draft' });
                } else {
                    await handleSave(false); // Ensure latest changes are saved
                    await publishEvent(eventId);
                    toast.success("Etkinlik yayınlandı! 🎉");
                    setEvent({ ...event, status: 'published' });
                }
            } catch (error) {
                console.error(error);
                toast.error("İşlem sırasında hata oluştu.");
            }
        });
    };

    // Form States
    // Section 1: What
    const [title, setTitle] = useState("");
    const [selectedChannelId, setSelectedChannelId] = useState("");
    const [channels, setChannels] = useState<{ id: string, name: string }[]>([]);

    // Section 2: When
    const [startDate, setStartDate] = useState("");
    const [startTime, setStartTime] = useState("23:00");
    const [endDate, setEndDate] = useState("");
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

    // Load available channels
    useEffect(() => {
        if (isOpen && communityId) {
            getCommunityChannels(communityId, 'event').then((data: { id: string, name: string }[]) => {
                if (data) setChannels(data);
            });
        }
    }, [isOpen, communityId]);

    // Fetch event data
    useEffect(() => {
        if (isOpen && eventId) {
            setIsLoading(true);
            getEvent(eventId).then((data) => {
                if (data) {
                    setEvent(data);
                    // Populate form
                    setTitle(data.title);
                    setSelectedChannelId(data.channel_id);

                    const start = new Date(data.start_time);
                    const end = new Date(data.end_time);
                    setStartDate(format(start, 'yyyy-MM-dd'));
                    setStartTime(format(start, 'HH:mm'));
                    setEndDate(format(end, 'yyyy-MM-dd'));
                    setEndTime(format(end, 'HH:mm'));
                    setRepeatFrequency(data.recurrence || "none");

                    setEventType(data.event_type);
                    setLocationAddress(data.location_address || "");
                    setEventUrl(data.event_url || "");

                    if (data.live_stream_settings) {
                        const settings = typeof data.live_stream_settings === 'string'
                            ? JSON.parse(data.live_stream_settings)
                            : data.live_stream_settings;
                        setRecordLive(settings.recordLive || false);
                        setMuteParticipants(settings.muteParticipants || false);
                        setDisableChat(settings.disableChat || false);
                        setHideParticipantsList(settings.hideParticipantsList || false);
                    }

                    setIsPaidEvent(data.is_paid ? "paid" : "free");
                    setTicketPrice(data.ticket_price ? data.ticket_price.toString() : "");
                }
                setIsLoading(false);
            });
        }
    }, [isOpen, eventId]);

    const handlePublish = () => {
        startTransition(async () => {
            try {
                // First save any changes
                await handleSave(false); // don't show toast for clean flow? or show toast?

                await publishEvent(eventId);
                toast.success("Etkinlik yayınlandı! 🎉");
                onClose();
            } catch (error) {
                console.error(error);
                toast.error("Etkinlik yayınlanırken hata oluştu.");
            }
        });
    };

    const handleSave = async (showToast = true) => {
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

        try {
            const isPaid = isPaidEvent === "paid";

            await updateEvent(eventId, {
                title,
                channelId: selectedChannelId,
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

            if (showToast) toast.success("Değişiklikler kaydedildi!");
        } catch (error) {
            console.error(error);
            toast.error("Kayıt sırasında hata oluştu.");
            throw error; // Re-throw for handlePublish
        }
    };

    const handleStartDateSelect = (date: Date | undefined) => {
        if (!date) return;
        const newStartDateStr = format(date, 'yyyy-MM-dd');
        setStartDate(newStartDateStr);
        // Auto-sync end date if not set or user wants behavior
        // Keeping it simple: behave like standard date picker
    };

    // Generate time options (00:00 to 23:30)
    const timeOptions = Array.from({ length: 48 }, (_, i) => {
        const hour = Math.floor(i / 2);
        const minute = i % 2 === 0 ? "00" : "30";
        return `${hour.toString().padStart(2, "0")}:${minute}`;
    });

    if (!isOpen) return null;
    if (isLoading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
        );
    }

    type TabType = 'overview' | 'people' | 'basic_info' | 'post_details' | 'notifications' | 'reminders' | 'advanced';

    const TabButton = ({ id, label }: { id: TabType, label: string }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={cn(
                "px-4 py-3 text-sm font-medium transition-colors relative whitespace-nowrap",
                activeTab === id
                    ? "text-gray-900"
                    : "text-gray-500 hover:text-gray-900"
            )}
        >
            {label}
            {activeTab === id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 mx-3 rounded-full" />
            )}
        </button>
    );

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent side="bottom" className="h-[95vh] p-0 rounded-t-xl overflow-hidden flex flex-col gap-0 border-none shadow-2xl bg-white">
                {/* Header Navbar */}
                <div className="flex flex-col md:flex-row items-center justify-between px-6 py-2 border-b border-gray-100 bg-white sticky top-0 z-10">
                    {/* Left: Title */}
                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
                        <div className="flex items-center gap-3">
                            <SheetTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
                                {title || "Yeni Etkinlik"}
                                {event?.status === 'published' ? (
                                    <span className="inline-flex items-center rounded-md bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                        YAYINDA
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                                        TASLAK
                                    </span>
                                )}
                            </SheetTitle>
                        </div>
                    </div>

                    {/* Center: Tabs */}
                    <div className="flex items-center overflow-x-auto no-scrollbar w-full md:w-auto -order-1 md:order-none py-2 md:py-0 border-b md:border-none border-gray-100">
                        <div className="flex items-center gap-1 mx-auto">
                            <TabButton id="overview" label="Genel Bakış" />
                            <TabButton id="people" label="People" />
                            <TabButton id="basic_info" label="Temel Bilgiler" />
                            <TabButton id="post_details" label="Post details" />
                            <TabButton id="notifications" label="Notifications" />
                            <TabButton id="reminders" label="Reminders" />
                            <TabButton id="advanced" label="Advanced" />
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="hidden md:flex items-center gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => window.open(`/events/${eventId}`, '_blank')}
                            className="text-gray-600 font-medium hover:bg-gray-50 text-sm h-9"
                        >
                            <Eye className="w-4 h-4 mr-2" />
                            Önizle
                        </Button>
                        <Button
                            onClick={handleTogglePublish}
                            disabled={isSaving}
                            variant={event?.status === 'published' ? "destructive" : "default"}
                            className={cn(
                                "font-medium rounded-full px-6 h-9 shadow-sm transition-all",
                                event?.status === 'published' ? "" : "bg-[#1c1c1c] hover:bg-black text-white"
                            )}
                        >
                            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {event?.status === 'published' ? 'Yayından Kaldır' : 'Yayınla'}
                        </Button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto bg-white">
                    <div className="max-w-4xl mx-auto px-6 py-12">
                        {/* Tab Content */}
                        {activeTab === 'overview' ? (
                            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-200">
                                <div className="space-y-6">
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3">
                                                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">{title || "Yeni Etkinlik"}</h1>
                                                {event?.status === 'published' ? (
                                                    <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                                        YAYINDA
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                                                        TASLAK
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-500 font-medium">
                                                <CalendarIcon className="w-5 h-5" />
                                                <span>
                                                    {startDate ? format(new Date(startDate), "d MMMM, HH:mm", { locale: tr }) : "Tarih"}
                                                </span>
                                            </div>
                                        </div>


                                    </div>


                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Attendees Box */}
                                    <div className="bg-white border border-gray-200 rounded-xl p-6 h-32 flex flex-col justify-between shadow-sm">
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <Users className="w-4 h-4" />
                                            <h3 className="text-sm font-semibold">Katılımcı Sayısı</h3>
                                        </div>
                                        <span className="text-3xl font-bold text-gray-900">{stats?.attendeeCount || 0} Kişi</span>
                                    </div>

                                    {/* Revenue Box */}
                                    <div className="bg-white border border-gray-200 rounded-xl p-6 h-32 flex flex-col justify-between shadow-sm">
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <h3 className="text-sm font-semibold">Toplam Ciro</h3>
                                        </div>
                                        <span className="text-3xl font-bold text-gray-900">
                                            {isPaidEvent === 'paid'
                                                ? `₺${((stats?.attendeeCount || 0) * (parseFloat(ticketPrice) || 0)).toLocaleString('tr-TR')}`
                                                : "Ücretsiz"}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-white border border-gray-200 rounded-xl p-8 min-h-[300px] flex flex-col shadow-sm">
                                    <h3 className="text-sm font-semibold text-gray-500 mb-6">Son Katılımcılar</h3>
                                    {stats?.latestAttendees && stats.latestAttendees.length > 0 ? (
                                        <div className="space-y-4">
                                            {stats.latestAttendees.map((ticket) => (
                                                <div key={ticket.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-full bg-gray-100 overflow-hidden">
                                                            {ticket.user?.avatar_url ? (
                                                                <img src={ticket.user.avatar_url} alt={ticket.user.full_name} className="h-full w-full object-cover" />
                                                            ) : (
                                                                <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-500">
                                                                    <User className="h-5 w-5" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900">{ticket.user?.full_name || "İsimsiz Kullanıcı"}</p>
                                                            <p className="text-xs text-gray-500">{format(new Date(ticket.created_at), "d MMM, HH:mm", { locale: tr })}</p>
                                                        </div>
                                                    </div>
                                                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                                        {isPaidEvent === 'paid' ? 'Ödendi ✅' : 'Kayıtlı ✅'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex items-center justify-center">
                                            <p className="text-lg font-medium text-gray-900">Henüz katılımcı yok</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : activeTab === 'basic_info' ? (
                            <div className="space-y-12 animate-in fade-in zoom-in-95 duration-200">
                                {/* Basic Info Header */}
                                <div className="space-y-1 text-center md:text-left">
                                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Temel Bilgiler</h1>
                                </div>

                                {/* 1. Etkinlik nedir? */}
                                <section className="space-y-6">
                                    <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Etkinlik nedir?</h3>
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
                                    <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Etkinlik ne zaman?</h3>
                                    <div className="space-y-4">
                                        <div className="space-y-3">
                                            <Label className="text-base font-bold text-gray-900">Tarih & Saat</Label>
                                            <div className="flex flex-col lg:flex-row items-center gap-4">
                                                {/* Start Date & Time */}
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

                                                    <Select value={startTime} onValueChange={setStartTime}>
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

                                                {/* End Date & Time */}
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
                                    <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Etkinlik nerede?</h3>
                                    <div className="space-y-2">
                                        <Label className="text-base font-bold text-gray-900">Konum</Label>
                                        <Select value={eventType} onValueChange={(val) => setEventType(val as EventType)}>
                                            <SelectTrigger className="h-11 bg-white border-gray-300 focus:ring-0 focus:border-gray-900 rounded-md text-gray-900 w-full text-base">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="physical" className="text-base">
                                                    <div className="flex items-center gap-2"><span>Yüz yüze</span></div>
                                                </SelectItem>
                                                <SelectItem value="online_zoom" className="text-base">
                                                    <div className="flex items-center gap-2"><span>Bağlantı (Zoom, YouTube vb.)</span></div>
                                                </SelectItem>
                                                <SelectItem value="welldo_live" className="text-base">
                                                    <div className="flex items-center gap-2"><span>WellDo Canlı Yayın</span></div>
                                                </SelectItem>
                                                <SelectItem value="tbd" className="text-base">
                                                    <div className="flex items-center gap-2"><span>Henüz belli değil (TBD)</span></div>
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
                                            <div className="space-y-4 pt-4">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-base font-bold text-gray-900 cursor-pointer">Canlı yayını kaydet (30 Günlük)</Label>
                                                    <Switch checked={recordLive} onCheckedChange={setRecordLive} />
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-base font-bold text-gray-900 cursor-pointer">Katılımcılar sessiz başlasın</Label>
                                                    <Switch checked={muteParticipants} onCheckedChange={setMuteParticipants} />
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-base font-bold text-gray-900 cursor-pointer">Sohbeti devre dışı bırak</Label>
                                                    <Switch checked={disableChat} onCheckedChange={setDisableChat} />
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-base font-bold text-gray-900 cursor-pointer">Katılımcı listesini gizle</Label>
                                                    <Switch checked={hideParticipantsList} onCheckedChange={setHideParticipantsList} />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </section>

                                {/* 4. Bu ücretli bir etkinlik mi? */}
                                <section className="space-y-6">
                                    <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Bu ücretli bir etkinlik mi?</h3>
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

                                <div className="flex justify-end pt-4">
                                    <Button
                                        onClick={() => handleSave(true)}
                                        disabled={isSaving}
                                        variant="outline"
                                        className="px-8"
                                    >
                                        {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        Değişiklikleri kaydet
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-32 text-center space-y-4">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                                    <Settings className="w-8 h-8 text-gray-300" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-medium text-gray-900">Work in Progress</h3>
                                    <p className="text-gray-500">The <strong>{activeTab.replace('_', ' ')}</strong> tab is coming soon.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions (Mobile Only) */}
                <div className="md:hidden p-4 border-t border-gray-100 bg-white sticky bottom-0 z-10 flex gap-3">
                    <Button variant="outline" onClick={onClose} className="flex-1 h-11 rounded-full border-gray-300">
                        Cancel
                    </Button>
                    <Button onClick={handlePublish} disabled={isSaving} className="flex-1 h-11 rounded-full bg-[#1c1c1c] text-white">
                        Publish
                    </Button>
                </div>
            </SheetContent>
        </Sheet >
    );
}
