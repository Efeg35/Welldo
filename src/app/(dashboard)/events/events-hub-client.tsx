"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EventsHubHeader, type ViewMode, type TypeFilter } from "@/components/events/events-hub-header";
import { EventsCalendarView } from "@/components/events/events-calendar-view";
import { EventsListView } from "@/components/events/events-list-view";
import { EventDetailPanel } from "@/components/events/event-detail-panel";
import { EventsHubSettingsPanel } from "@/components/events/events-hub-settings-panel";
import { updateChannel } from "@/actions/community";
import { toast } from "sonner";
import type { Event } from "@/types";

interface EventsHubClientProps {
    initialEvents: Event[];
    isAdmin: boolean;
    userId?: string;
    userProfile?: any;
    communityId?: string;
    channelId?: string;
    accessLevel?: 'open' | 'private' | 'secret';
    initialSettings?: any;
}

export function EventsHubClient({
    initialEvents,
    isAdmin,
    userId,
    userProfile,
    communityId,
    channelId,
    accessLevel: initialAccessLevel,
    initialSettings
}: EventsHubClientProps) {
    const router = useRouter();
    const [detailOpen, setDetailOpen] = useState(false);
    const [currentAccessLevel, setCurrentAccessLevel] = useState(initialAccessLevel);
    const [channelSettings, setChannelSettings] = useState(initialSettings);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>(channelSettings?.default_view || "calendar");
    const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

    // Filter events by type
    const filteredEvents = initialEvents.filter(event => {
        if (typeFilter === "all") return true;
        if (typeFilter === "physical") return event.event_type === "physical";
        if (typeFilter === "online") return event.event_type === "online_zoom" || event.event_type === "welldo_live";
        if (typeFilter === "paid") return event.ticket_price > 0;
        return true;
    });

    const handleEventClick = (event: Event) => {
        setSelectedEvent(event);
        setDetailOpen(true);
    };

    const handleMonthChange = (newMonth: Date) => {
        setCurrentMonth(newMonth);
    };

    const handleNewEvent = () => {
        // Navigate to event channel for creation (or implement inline modal later)
        if (communityId && channelId) {
            router.push(`/community/${communityId}/events?create=true`);
        }
    };

    const handleAccessLevelChange = async (level: 'open' | 'private' | 'secret') => {
        if (!channelId) return;
        try {
            await updateChannel(channelId, { access_level: level });
            setCurrentAccessLevel(level);
            toast.success(level === 'open' ? 'Kanal herkese açık yapıldı' : 'Kanal gizli yapıldı');
        } catch (error) {
            toast.error('Erişim ayarı güncellenemedi');
        }
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <EventsHubHeader
                viewMode={viewMode}
                setViewMode={setViewMode}
                typeFilter={typeFilter}
                setTypeFilter={setTypeFilter}
                isAdmin={isAdmin}
                canSwitchView={isAdmin || channelSettings?.allow_view_switch === true}
                onNewEvent={handleNewEvent}
                onOpenSettings={() => setSettingsOpen(true)}
                accessLevel={currentAccessLevel}
                onAccessLevelChange={handleAccessLevelChange}
            />

            {/* Content */}
            <div className="flex-1 overflow-hidden bg-gray-50/50">
                {viewMode === "calendar" ? (
                    <div className="h-full p-4 md:p-6 pb-20 md:pb-6">
                        <div className="h-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <EventsCalendarView
                                events={filteredEvents}
                                currentMonth={currentMonth}
                                setCurrentMonth={handleMonthChange}
                                onEventClick={handleEventClick}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="h-full overflow-y-auto pb-20 md:pb-6">
                        <EventsListView
                            events={filteredEvents}
                            onEventClick={handleEventClick}
                            userId={userId}
                            isAdmin={isAdmin}
                        />
                    </div>
                )}
            </div>

            {/* Event Detail Panel */}
            <EventDetailPanel
                event={selectedEvent}
                open={detailOpen}
                onOpenChange={setDetailOpen}
                userId={userId}
                isAdmin={isAdmin}
            />

            {/* Hub Settings Panel */}
            <EventsHubSettingsPanel
                open={settingsOpen}
                onOpenChange={setSettingsOpen}
                currentSettings={channelSettings}
                onSave={async (newSettings) => {
                    if (!channelId) return;
                    await updateChannel(channelId, { settings: newSettings });
                    setChannelSettings(newSettings);
                    toast.success("Ayarlar kaydedildi");
                }}
            />
        </div>
    );
}

