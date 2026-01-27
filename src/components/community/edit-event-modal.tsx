"use client";

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useTransition, useEffect } from "react";
import { updateEvent, publishEvent, unpublishEvent, getEvent, getEventStats, getEventAttendees, addEventAttendee, createEmailSchedule, getEmailSchedules, deleteEmailSchedule } from "@/actions/events";
import { getCommunityChannels, searchUsers } from "@/actions/community";
import { toast } from "sonner";
import { EmailReminderDialog } from "./email-reminder-dialog";
import {
    Loader2, X, MoreHorizontal, Calendar as CalendarIcon, Clock, HelpCircle,
    Settings, ArrowUpRight, Copy, Eye, Users, User, Download, UserPlus, Search,
    Plus, Image as ImageIcon, Paperclip, FileText, Video, Trash2,
    Heading1, Heading2, List, Quote, Minus, Youtube, Smile, Check, Link,
    Bell, Mail, MessageSquare, Ticket
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Event, EventStatus, EventType } from "@/types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    const [attendees, setAttendees] = useState<any[]>([]);

    // Formatting State
    const [showYoutubeInput, setShowYoutubeInput] = useState(false);
    const [youtubeLink, setYoutubeLink] = useState("");

    // Notification State (Bound to settings)
    const [emailSchedules, setEmailSchedules] = useState<any[]>([]);
    const [isEmailReminderOpen, setIsEmailReminderOpen] = useState(false);

    // Add Attendee Search State
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isAddingAttendee, setIsAddingAttendee] = useState(false);

    // Post Details State
    const [coverImage, setCoverImage] = useState<string | null>(null);
    const [description, setDescription] = useState("");
    const [attachments, setAttachments] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    // Advanced Settings State
    const [settings, setSettings] = useState({
        reminders: {
            in_app_enabled: true,
            email_enabled: true
        },
        notifications: {
            send_post_notification: true,
            send_confirmation_email: true
        },
        permissions: {
            comments_disabled: false,
            hide_attendees: false
        },
        attendees: {
            rsvp_limit: null as number | null,
            allow_guests: false
        },
        seo: {
            meta_title: null as string | null,
            meta_description: null as string | null,
            og_image_url: null as string | null
        }
    });

    const [isSaving, startTransition] = useTransition();

    useEffect(() => {
        if (event) {
            setCoverImage(event.cover_image_url || null);
            setDescription(event.description || "");
            setAttachments(event.attachments || []);
            // Load advanced settings
            if (event.settings) {
                setSettings(prev => ({
                    reminders: { ...prev.reminders, ...event.settings?.reminders },
                    notifications: { ...prev.notifications, ...event.settings?.notifications },
                    permissions: { ...prev.permissions, ...event.settings?.permissions },
                    attendees: { ...prev.attendees, ...event.settings?.attendees },
                    seo: { ...prev.seo, ...event.settings?.seo }
                }));
            }
        }
    }, [event]);

    // Fetch Email Schedules
    useEffect(() => {
        if (isOpen && eventId && activeTab === 'reminders') {
            getEmailSchedules(eventId).then(setEmailSchedules);
        }
    }, [isOpen, eventId, activeTab]);

    const handleAddEmailSchedule = async (data: { subject: string; content: string; scheduledAt: Date }) => {
        try {
            await createEmailSchedule({
                eventId,
                subject: data.subject,
                content: data.content,
                scheduledAt: data.scheduledAt
            });
            toast.success("E-posta hatırlatması planlandı.");
            // Refresh
            getEmailSchedules(eventId).then(setEmailSchedules);
        } catch (error) {
            toast.error("Planlama başarısız.");
        }
    };

    const handleDeleteEmailSchedule = async (id: string) => {
        if (!confirm("Bu hatırlatmayı silmek istediğinize emin misiniz?")) return;
        try {
            await deleteEmailSchedule(id);
            toast.success("Hatırlatma silindi.");
            setEmailSchedules(prev => prev.filter(s => s.id !== id));
        } catch (error) {
            toast.error("Silme başarısız.");
        }
    };

    const uploadFile = async (file: File) => {
        // Validation
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
            'image/jpeg',
            'image/png'
        ];

        if (file.size > maxSize) {
            toast.error("Dosya boyutu 5MB'dan küçük olmalıdır.");
            throw new Error("File too large");
        }

        if (!allowedTypes.includes(file.type)) {
            toast.error("Geçersiz dosya türü. Sadece PDF, Word, Excel ve Resim yükleyebilirsiniz.");
            throw new Error("Invalid file type");
        }

        setIsUploading(true);
        try {
            const supabase = createClient();
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `event-attachments/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('event-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('event-images').getPublicUrl(filePath);
            return data.publicUrl;
        } catch (error: any) {
            console.error("Upload error:", error);
            toast.error("Dosya yüklenirken hata oluştu.");
            throw error;
        } finally {
            setIsUploading(false);
        }
    };

    // Helper to insert text into description
    const insertTextAtCursor = (textToInsert: string) => {
        setDescription(prev => {
            const separator = prev.length > 0 && !prev.endsWith('\n') ? '\n' : '';
            return prev + separator + textToInsert;
        });
    };

    const handleFormatting = (type: 'h1' | 'h2' | 'list' | 'quote' | 'divider') => {
        switch (type) {
            case 'h1':
                insertTextAtCursor('# ');
                break;
            case 'h2':
                insertTextAtCursor('## ');
                break;
            case 'list':
                insertTextAtCursor('- ');
                break;
            case 'quote':
                insertTextAtCursor('> ');
                break;
            case 'divider':
                insertTextAtCursor('---\n');
                break;
        }
    };

    const handleAddYoutubeLink = () => {
        if (!youtubeLink) {
            setShowYoutubeInput(false);
            return;
        }
        insertTextAtCursor(description ? `\n\n${youtubeLink}\n` : youtubeLink);
        setYoutubeLink("");
        setShowYoutubeInput(false);
    };

    const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const url = await uploadFile(file);
            setCoverImage(url);

            // Auto-save cover image immediately
            if (event) {
                await updateEvent(event.id, { coverImageUrl: url });
                toast.success("Kapak fotoğrafı yüklendi ve kaydedildi!");
            }
        } catch (error) {
            // Error handled in uploadFile
        }
    };

    const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const url = await uploadFile(file);
            const newAttachment = {
                name: file.name,
                url: url,
                size: file.size,
                type: file.type
            };
            setAttachments([...attachments, newAttachment]);
            toast.success("Dosya eklendi (Kaydetmeyi unutmayın)");
        } catch (error) {
            // Error handled
        }
    };

    const handleVideoEmbed = () => {
        const url = window.prompt("Video bağlantısını yapıştırın (YouTube, Vimeo vb.):");
        if (!url) return;

        // Basic validation
        if (!url.includes('http')) {
            toast.error("Geçerli bir bağlantı giriniz.");
            return;
        }

        const embedMarkdown = `\n[VIDEO: ${url}]\n`;
        setDescription(prev => prev + embedMarkdown);
    };

    const handleSavePostDetails = async () => {
        if (!event) return;
        startTransition(async () => {
            try {
                await updateEvent(event.id, {
                    coverImageUrl: coverImage || undefined,
                    description: description,
                    attachments: attachments
                });
                toast.success("Değişiklikler kaydedildi!");

                // Refresh local event data
                const updated = await getEvent(event.id);
                setEvent(updated);
            } catch (error) {
                toast.error("Kaydetme başarısız.");
            }
        });
    };

    // Fetch stats when Overview tab is active
    useEffect(() => {
        if (isOpen && eventId && activeTab === 'overview') {
            getEventStats(eventId).then((data) => {
                setStats(data);
            });
        }
    }, [isOpen, eventId, activeTab]);

    // Fetch attendees when People tab is active
    useEffect(() => {
        if (isOpen && eventId && activeTab === 'people') {
            getEventAttendees(eventId).then((data) => {
                setAttendees(data || []);
            });
        }
    }, [isOpen, eventId, activeTab]);

    // Debounced search for users
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.length >= 2) {
                setIsSearching(true);
                searchUsers(searchQuery, communityId).then((results) => {
                    setSearchResults(results || []);
                    setIsSearching(false);
                });
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, communityId]);

    const handleAddAttendee = async (userId: string) => {
        setIsAddingAttendee(true);
        try {
            await addEventAttendee(eventId, userId);
            toast.success("Katılımcı eklendi!");

            // Refresh list
            const updated = await getEventAttendees(eventId);
            setAttendees(updated || []);

            // Clear search
            setSearchQuery("");
            setSearchResults([]);
        } catch (error: any) {
            toast.error(error.message || "Ekleme başarısız.");
        } finally {
            setIsAddingAttendee(false);
        }
    };

    const handleDownloadCSV = () => {
        if (!attendees.length) return;

        const headers = ["ID", "Name", "Email", "Date Joined", "Status"];
        const rows = attendees.map(t => [
            t.id,
            t.user?.full_name || "Unknown",
            t.user?.email || "",
            format(new Date(t.created_at), "yyyy-MM-dd HH:mm"),
            "Confirmed"
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `event_${eventId}_attendees.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

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
                coverImageUrl: coverImage || undefined,
                settings,
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
                            <TabButton id="people" label="Kişiler" />
                            <TabButton id="basic_info" label="Temel Bilgiler" />
                            <TabButton id="post_details" label="Detaylar" />
                            <TabButton id="notifications" label="Bildirimler" />
                            <TabButton id="reminders" label="Hatırlatıcılar" />
                            <TabButton id="advanced" label="Gelişmiş" />
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
                        ) : activeTab === 'people' ? (
                            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-200">
                                <div className="space-y-6">
                                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Katılımcılar</h1>

                                    {/* Sub-tabs / Filter & Actions */}
                                    <div className="flex items-center justify-between border-b border-gray-100 pb-0">
                                        <div className="flex items-center gap-6">
                                            <button className="pb-3 border-b-2 border-black font-semibold text-gray-900 text-sm">
                                                Katılımcılar
                                            </button>

                                        </div>
                                        <button
                                            onClick={handleDownloadCSV}
                                            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 pb-3"
                                        >
                                            CSV İndir
                                            <Download className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Action Row */}
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-bold text-gray-900">{attendees.length} Katılımcı</h3>

                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className="rounded-full border-gray-300 font-medium h-9 px-4 text-gray-700 hover:bg-gray-50">
                                                    <UserPlus className="w-4 h-4 mr-2" />
                                                    Katılımcı Ekle
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-80 p-0" align="end">
                                                <div className="p-3 border-b border-gray-100">
                                                    <div className="relative">
                                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                                                        <Input
                                                            placeholder="İsim ile ara..."
                                                            className="pl-9 bg-gray-50 border-gray-200"
                                                            value={searchQuery}
                                                            onChange={(e) => setSearchQuery(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="max-h-64 overflow-y-auto p-1">
                                                    {isSearching ? (
                                                        <div className="flex justify-center p-4">
                                                            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                                                        </div>
                                                    ) : searchResults.length > 0 ? (
                                                        <div className="space-y-1">
                                                            {searchResults.map((user) => (
                                                                <button
                                                                    key={user.id}
                                                                    onClick={() => handleAddAttendee(user.id)}
                                                                    disabled={isAddingAttendee}
                                                                    className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md text-left transition-colors group"
                                                                >
                                                                    <div className="h-8 w-8 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                                                                        {user.avatar_url ? (
                                                                            <img src={user.avatar_url} alt={user.full_name} className="h-full w-full object-cover" />
                                                                        ) : (
                                                                            <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-500">
                                                                                <User className="h-4 w-4" />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-sm font-medium text-gray-900 truncate">{user.full_name}</p>
                                                                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                                                    </div>
                                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <div className="h-7 w-7 flex items-center justify-center rounded-full bg-gray-100 text-gray-700">
                                                                            <Plus className="w-4 h-4" />
                                                                        </div>
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    ) : searchQuery.length >= 2 ? (
                                                        <div className="p-4 text-center text-sm text-gray-500">
                                                            Sonuç bulunamadı
                                                        </div>
                                                    ) : (
                                                        <div className="p-4 text-center text-sm text-gray-500">
                                                            Aramak için yazın
                                                        </div>
                                                    )}
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    {/* Attendees List */}
                                    <div className="space-y-1">
                                        {attendees.length > 0 ? (
                                            <div className="divide-y divide-gray-100 border rounded-xl border-gray-100 overflow-hidden">
                                                {attendees.map((attendee) => (
                                                    <div key={attendee.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors bg-white">
                                                        <div className="h-10 w-10 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                                                            {attendee.user?.avatar_url ? (
                                                                <img src={attendee.user.avatar_url} alt={attendee.user.full_name} className="h-full w-full object-cover" />
                                                            ) : (
                                                                <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-500">
                                                                    <User className="h-5 w-5" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-semibold text-gray-900 truncate">{attendee.user?.full_name || "İsimsiz Kullanıcı"}</p>
                                                            <p className="text-xs text-gray-500 truncate">{attendee.user?.email}</p>
                                                        </div>
                                                        <div className="text-right text-xs text-gray-500">
                                                            {format(new Date(attendee.created_at), "d MMM yyyy", { locale: tr })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            /* Empty State */
                                            <div className="text-center py-20 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                                                <p className="text-gray-500">Henüz katılımcı yok</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : activeTab === 'post_details' ? (
                            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-200">
                                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Detaylar</h1>

                                {/* Cover Image */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-gray-900">Kapak Görseli</h3>
                                    {coverImage ? (
                                        <div className="relative group rounded-xl overflow-hidden border border-gray-200">
                                            <img src={coverImage} alt="Cover" className="w-full h-48 object-cover" />
                                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full" onClick={() => setCoverImage(null)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <label className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center gap-3 transition-colors hover:bg-gray-50 hover:border-gray-300 cursor-pointer relative group/upload">
                                            <input
                                                type="file"
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                accept="image/*"
                                                onChange={handleCoverImageUpload}
                                            />
                                            <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center group-hover/upload:bg-gray-200 transition-colors">
                                                <ImageIcon className="w-6 h-6 text-gray-400" />
                                            </div>
                                            <div className="text-center">
                                                <span className="text-base font-semibold text-gray-900 group-hover/upload:underline">
                                                    Görsel Yükle
                                                </span>
                                                <p className="text-sm text-gray-500">Önerilen boyut: 1024x366</p>
                                            </div>
                                        </label>
                                    )}
                                </div>

                                {/* Description */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-gray-900">Etkinlik Açıklaması</h3>
                                    <div className="border border-gray-200 rounded-xl overflow-hidden focus-within:ring-1 focus-within:ring-black focus-within:border-black transition-all bg-white">
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Etkinliğinizi anlatın..."
                                            className="w-full min-h-[300px] p-6 resize-y focus:outline-none text-base text-gray-900 placeholder:text-gray-400"
                                        />

                                        {/* Toolbar */}
                                        <div className="bg-gray-50 border-t border-gray-100 px-4 py-3 flex items-center justify-between">
                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="hover:bg-muted/50 hover:text-foreground relative group h-8 w-8">
                                                            <div className="rounded-full border border-muted-foreground/30 p-1 group-hover:border-gray-900 group-hover:text-gray-900 transition-colors">
                                                                <Plus className="w-3 h-3" />
                                                            </div>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="start" className="w-56 p-2" side="top">
                                                        <div className="text-xs font-semibold text-muted-foreground px-2 py-1 mb-1 uppercase tracking-wider">Temel Formatlama</div>
                                                        <DropdownMenuItem onClick={() => handleFormatting('h1')} className="cursor-pointer gap-2">
                                                            <Heading1 className="w-4 h-4" />
                                                            <span>Başlık 1</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleFormatting('h2')} className="cursor-pointer gap-2">
                                                            <Heading2 className="w-4 h-4" />
                                                            <span>Başlık 2</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleFormatting('list')} className="cursor-pointer gap-2">
                                                            <List className="w-4 h-4" />
                                                            <span>Liste</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleFormatting('quote')} className="cursor-pointer gap-2">
                                                            <Quote className="w-4 h-4" />
                                                            <span>Alıntı</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleFormatting('divider')} className="cursor-pointer gap-2">
                                                            <Minus className="w-4 h-4" />
                                                            <span>Ayırıcı</span>
                                                        </DropdownMenuItem>

                                                        <div className="h-px bg-border my-2" />

                                                        <div className="text-xs font-semibold text-muted-foreground px-2 py-1 mb-1 uppercase tracking-wider">Medya</div>
                                                        <DropdownMenuItem className="cursor-pointer gap-2 relative">
                                                            <ImageIcon className="w-4 h-4" />
                                                            <span>Resim</span>
                                                            <input
                                                                type="file"
                                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                                accept="image/*"
                                                                onChange={async (e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (!file) return;
                                                                    try {
                                                                        const url = await uploadFile(file);
                                                                        setDescription(prev => prev + `\n![image](${url})`);
                                                                        toast.success("Resim eklendi");
                                                                    } catch (err) { }
                                                                }}
                                                            />
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="cursor-pointer gap-2 relative">
                                                            <Paperclip className="w-4 h-4" />
                                                            <span>Dosya</span>
                                                            <input
                                                                type="file"
                                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                                onChange={handleAttachmentUpload}
                                                            />
                                                        </DropdownMenuItem>

                                                        <div className="h-px bg-border my-2" />

                                                        <div className="text-xs font-semibold text-muted-foreground px-2 py-1 mb-1 uppercase tracking-wider">Embed</div>
                                                        <DropdownMenuItem onClick={() => setShowYoutubeInput(true)} className="cursor-pointer gap-2">
                                                            <Link className="w-4 h-4" />
                                                            <span>Video / Embed</span>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>

                                                <Button variant="ghost" size="icon" className="hover:bg-muted/50 hover:text-foreground relative overflow-hidden h-8 w-8 text-gray-500">
                                                    <label className="cursor-pointer flex items-center justify-center w-full h-full absolute inset-0">
                                                        <ImageIcon className="w-4 h-4" />
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={async (e) => {
                                                                const file = e.target.files?.[0];
                                                                if (!file) return;
                                                                try {
                                                                    const url = await uploadFile(file);
                                                                    setDescription(prev => prev + `\n![image](${url})`);
                                                                    toast.success("Resim eklendi");
                                                                } catch (err) { }
                                                            }}
                                                        />
                                                    </label>
                                                </Button>

                                                <Button variant="ghost" size="icon" className="hover:bg-muted/50 hover:text-foreground relative overflow-hidden h-8 w-8 text-gray-500">
                                                    <label className="cursor-pointer flex items-center justify-center w-full h-full absolute inset-0">
                                                        <Paperclip className="w-4 h-4" />
                                                        <input
                                                            type="file"
                                                            className="hidden"
                                                            onChange={handleAttachmentUpload}
                                                        />
                                                    </label>
                                                </Button>

                                                <Popover open={showYoutubeInput} onOpenChange={setShowYoutubeInput}>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className={cn("hover:bg-muted/50 hover:text-foreground h-8 w-8 text-gray-500", showYoutubeInput && "bg-muted text-foreground")}
                                                        >
                                                            <Youtube className="w-4 h-4" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-80 p-4" side="top" align="start">
                                                        <div className="space-y-3">
                                                            <div className="space-y-1">
                                                                <h4 className="text-sm font-medium leading-none">Video Ekle</h4>
                                                                <p className="text-sm text-muted-foreground">Video (YouTube, Vimeo vb.) linkini buraya yapıştırın.</p>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <Input
                                                                    autoFocus
                                                                    placeholder="https://youtube.com/..."
                                                                    value={youtubeLink}
                                                                    onChange={(e) => setYoutubeLink(e.target.value)}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') handleAddYoutubeLink();
                                                                    }}
                                                                    className="h-8"
                                                                />
                                                                <Button
                                                                    size="sm"
                                                                    onClick={handleAddYoutubeLink}
                                                                    disabled={!youtubeLink}
                                                                    className="h-8 bg-zinc-900 text-white hover:bg-zinc-800"
                                                                >
                                                                    Ekle
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                            </div>

                                            <div className="ml-auto">
                                                {isUploading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <Button
                                            onClick={handleSavePostDetails}
                                            disabled={isSaving || isUploading}
                                            className="rounded-full px-6 bg-[#1c1c1c] hover:bg-black text-white shadow-sm border-none"
                                        >
                                            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                            Kaydet
                                        </Button>
                                    </div>
                                </div>

                                {/* Attachments List */}
                                {attachments.length > 0 && (
                                    <div className="space-y-4 pt-4 border-t border-gray-100">
                                        <h3 className="text-lg font-bold text-gray-900">Ekli Dosyalar</h3>
                                        <div className="space-y-2">
                                            {attachments.map((file, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 group">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className="h-8 w-8 bg-white rounded-md border border-gray-200 flex items-center justify-center flex-shrink-0">
                                                            <FileText className="w-4 h-4 text-blue-500" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                                                            <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500"
                                                        onClick={() => {
                                                            const newAtt = [...attachments];
                                                            newAtt.splice(idx, 1);
                                                            setAttachments(newAtt);
                                                        }}
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : activeTab === 'notifications' ? (
                            <div className="space-y-12 animate-in fade-in zoom-in-95 duration-200">
                                <div className="space-y-1">
                                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Bildirimler</h1>
                                </div>

                                <div className="space-y-4 pt-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Switch
                                                checked={settings.notifications.send_post_notification}
                                                onCheckedChange={(checked) => setSettings(prev => ({
                                                    ...prev,
                                                    notifications: { ...prev.notifications, send_post_notification: checked }
                                                }))}
                                                className="data-[state=checked]:bg-gray-900"
                                            />
                                            <div className="flex items-center gap-2">
                                                <Label className="text-base font-medium text-gray-900">
                                                    {selectedChannelId
                                                        ? `${channels.find(c => c.id === selectedChannelId)?.name || 'Alan'} üyelerine e-posta bildirimi gönder`
                                                        : "Alan üyelerine e-posta bildirimi gönder"}
                                                </Label>
                                                <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Switch
                                                checked={settings.notifications.send_confirmation_email}
                                                onCheckedChange={(checked) => setSettings(prev => ({
                                                    ...prev,
                                                    notifications: { ...prev.notifications, send_confirmation_email: checked }
                                                }))}
                                                className="data-[state=checked]:bg-gray-900"
                                            />
                                            <div className="flex items-center gap-2">
                                                <Label className="text-base font-medium text-gray-900">Kayıt yapan katılımcıya onay bildirimi gönder</Label>
                                                <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                                            </div>
                                        </div>
                                    </div>
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
                                        className="px-8 rounded-full bg-[#1c1c1c] hover:bg-black text-white shadow-sm border-none"
                                    >
                                        {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        Değişiklikleri kaydet
                                    </Button>
                                </div>
                            </div>
                        ) : activeTab === 'reminders' ? (
                            /* Hatırlatıcılar Tab - Refined UI (Matching Notifications Style) */
                            <div className="space-y-12 animate-in fade-in zoom-in-95 duration-200">
                                <div className="space-y-1">
                                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Hatırlatıcılar</h1>
                                    <p className="text-gray-500">Katılımcılarınıza etkinlik öncesi otomatik bildirimler gönderin.</p>
                                </div>

                                <div className="space-y-4 pt-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Switch
                                                checked={settings.reminders.in_app_enabled}
                                                onCheckedChange={(checked) => setSettings(prev => ({
                                                    ...prev,
                                                    reminders: { ...prev.reminders, in_app_enabled: checked }
                                                }))}
                                                className="data-[state=checked]:bg-gray-900"
                                            />
                                            <div className="flex items-center gap-2">
                                                <Label className="text-base font-medium text-gray-900">Uygulama içi bildirim gönder (15dk önce)</Label>
                                                <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Switch
                                                checked={settings.reminders.email_enabled}
                                                onCheckedChange={(checked) => setSettings(prev => ({
                                                    ...prev,
                                                    reminders: { ...prev.reminders, email_enabled: checked }
                                                }))}
                                                className="data-[state=checked]:bg-gray-900"
                                            />
                                            <div className="flex items-center gap-2">
                                                <Label className="text-base font-medium text-gray-900">E-posta hatırlatması gönder (1 saat önce)</Label>
                                                <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6 pt-6">
                                    <h3 className="text-xl font-bold text-gray-900 tracking-tight">Email schedule</h3>

                                    <div className="space-y-3">
                                        {emailSchedules.map((schedule) => (
                                            <div key={schedule.id} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                                                        <Mail className="w-5 h-5 text-gray-500" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900 text-sm">{schedule.subject}</p>
                                                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                                            <span>To: {schedule.audience === 'all' ? 'Everyone' : schedule.audience === 'invited' ? 'Invited' : 'Going'}</span>
                                                            <span>•</span>
                                                            <span>Scheduled: {format(new Date(schedule.scheduled_at), "MMM d, yyyy 'at' h:mm a")}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0 text-gray-500 hover:text-gray-900">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                                            onClick={() => handleDeleteEmailSchedule(schedule.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        ))}

                                        <Button
                                            variant="outline"
                                            className="rounded-full border-gray-300 font-medium"
                                            onClick={() => setIsEmailReminderOpen(true)}
                                        >
                                            Add reminder
                                        </Button>
                                    </div>
                                </div>

                                <EmailReminderDialog
                                    open={isEmailReminderOpen}
                                    onOpenChange={setIsEmailReminderOpen}
                                    eventTitle={title}
                                    eventDate={startDate ? new Date(startDate) : undefined}
                                    onSave={handleAddEmailSchedule}
                                />
                            </div>
                        ) : activeTab === 'advanced' ? (
                            /* Gelişmiş Tab - Refined UI (Matching Notifications Style) */
                            <div className="space-y-12 animate-in fade-in zoom-in-95 duration-200 pb-20">
                                <div className="space-y-1">
                                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Gelişmiş Ayarlar</h1>
                                    <p className="text-gray-500">İzinler, katılım kuralları ve SEO yapılandırması.</p>
                                </div>

                                {/* İzinler Section */}
                                <section className="space-y-6">
                                    <h3 className="text-2xl font-bold text-gray-900 tracking-tight">İzinler & Gizlilik</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Switch
                                                    checked={settings.permissions.comments_disabled}
                                                    onCheckedChange={(checked) => setSettings(prev => ({
                                                        ...prev,
                                                        permissions: { ...prev.permissions, comments_disabled: checked }
                                                    }))}
                                                    className="data-[state=checked]:bg-gray-900"
                                                />
                                                <div className="flex items-center gap-2">
                                                    <Label className="text-base font-medium text-gray-900">Yorumları kapat</Label>
                                                    <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Switch
                                                    checked={settings.permissions.hide_attendees}
                                                    onCheckedChange={(checked) => setSettings(prev => ({
                                                        ...prev,
                                                        permissions: { ...prev.permissions, hide_attendees: checked }
                                                    }))}
                                                    className="data-[state=checked]:bg-gray-900"
                                                />
                                                <div className="flex items-center gap-2">
                                                    <Label className="text-base font-medium text-gray-900">Katılımcıları gizle</Label>
                                                    <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Katılım Ayarları Section */}
                                <section className="space-y-6">
                                    <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Katılım</h3>
                                    <div className="space-y-6">
                                        {/* RSVP Limit */}
                                        <div className="space-y-2">
                                            <Label className="text-base font-bold text-gray-900">Kontenjan (Kişi Sayısı)</Label>
                                            <Input
                                                type="number"
                                                placeholder="Sınırsız"
                                                value={settings.attendees.rsvp_limit ?? ''}
                                                onChange={(e) => setSettings(prev => ({
                                                    ...prev,
                                                    attendees: { ...prev.attendees, rsvp_limit: e.target.value ? parseInt(e.target.value) : null }
                                                }))}
                                                className="max-w-[200px] bg-white border-gray-300 focus:border-gray-900 focus:ring-0 rounded-md"
                                            />
                                            <p className="text-xs text-gray-500">Boş bırakırsanız sınırsız olur.</p>
                                        </div>

                                        {/* Allow Guests */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Switch
                                                    checked={settings.attendees.allow_guests}
                                                    onCheckedChange={(checked) => setSettings(prev => ({
                                                        ...prev,
                                                        attendees: { ...prev.attendees, allow_guests: checked }
                                                    }))}
                                                    className="data-[state=checked]:bg-gray-900"
                                                />
                                                <div className="flex items-center gap-2">
                                                    <Label className="text-base font-medium text-gray-900">Misafir kaydına izin ver</Label>
                                                    <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* SEO & Sosyal Medya Section */}
                                <section className="space-y-6">
                                    <h3 className="text-2xl font-bold text-gray-900 tracking-tight">SEO & Paylaşım</h3>
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <Label className="text-base font-bold text-gray-900">Meta Başlık</Label>
                                            <Input
                                                placeholder={title || 'Varsayılan: Etkinlik başlığı'}
                                                value={settings.seo.meta_title || ''}
                                                onChange={(e) => setSettings(prev => ({
                                                    ...prev,
                                                    seo: { ...prev.seo, meta_title: e.target.value || null }
                                                }))}
                                                className="bg-white border-gray-300 focus:border-gray-900 focus:ring-0 rounded-md"
                                            />
                                            <p className="text-xs text-gray-500">Tarayıcı sekmesinde ve Google sonuçlarında görünür.</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-base font-bold text-gray-900">Meta Açıklama</Label>
                                            <Textarea
                                                placeholder={description?.substring(0, 150) || 'Varsayılan: Etkinlik açıklaması (ilk 150 karakter)...'}
                                                value={settings.seo.meta_description || ''}
                                                onChange={(e) => setSettings(prev => ({
                                                    ...prev,
                                                    seo: { ...prev.seo, meta_description: e.target.value || null }
                                                }))}
                                                rows={3}
                                                className="bg-white border-gray-300 focus:border-gray-900 focus:ring-0 rounded-md resize-none"
                                            />
                                            <p className="text-xs text-gray-500">Google sonuçlarında başlığın altında görünür.</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-base font-bold text-gray-900">Sosyal Medya Görseli (OG Image)</Label>
                                            <div className="flex items-start gap-6 pt-2">
                                                {settings.seo.og_image_url ? (
                                                    <div className="relative group rounded-lg overflow-hidden border border-gray-200 shadow-sm transition-all hover:shadow-md">
                                                        <img src={settings.seo.og_image_url} alt="OG Image" className="w-[240px] h-[126px] object-cover" />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <button
                                                                onClick={() => setSettings(prev => ({ ...prev, seo: { ...prev.seo, og_image_url: null } }))}
                                                                className="bg-white/90 text-red-600 rounded-full p-2 hover:bg-white hover:scale-110 transition-all"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <label className="flex flex-col items-center justify-center w-full max-w-[240px] h-[126px] border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all group overflow-hidden bg-gray-50/50">
                                                        <div className="w-10 h-10 rounded-full bg-white group-hover:bg-gray-100 flex items-center justify-center mb-2 transition-colors border border-gray-100">
                                                            <ImageIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                                                        </div>
                                                        <span className="text-xs font-medium text-gray-500 group-hover:text-gray-700">Görsel Yükle</span>
                                                        <span className="text-[10px] text-gray-400 mt-1">1200x630 px</span>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={async (e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) {
                                                                    try {
                                                                        const url = await uploadFile(file);
                                                                        setSettings(prev => ({ ...prev, seo: { ...prev.seo, og_image_url: url } }));
                                                                    } catch (error) {
                                                                        console.error(error);
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                    </label>
                                                )}
                                                <div className="flex-1 space-y-2 pt-1">
                                                    <p className="text-sm text-gray-500 leading-relaxed">
                                                        Paylaşımlarda görünecek görsel.
                                                        Eğer yüklemezseniz, etkinliğin kapak resmi veya varsayılan topluluk resmi kullanılır.
                                                    </p>
                                                    <p className="text-xs font-medium text-gray-400">
                                                        Önerilen boyut: 1200 x 630 piksel.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>

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
            </SheetContent >
        </Sheet >
    );
}
