"use client";

import { useState, useMemo } from "react";
import { startOfMonth, endOfMonth, addMonths } from "date-fns";
import {
    EventsHubHeader,
    EventsCalendarView,
    EventsListView,
    EventDetailPanel,
    type ViewMode,
    type TypeFilter,
} from "@/components/events";
import { CreateEventModal } from "@/components/community/create-event";
import { getEventsForHub } from "@/actions/events";
import type { Event, Profile } from "@/types";

interface EventsHubClientProps {
    initialEvents: Event[];
    isAdmin: boolean;
    userId?: string;
    userProfile: Profile | null;
    communityId?: string;
    channelId?: string;
}

export function EventsHubClient({
    initialEvents,
    isAdmin,
    userId,
    userProfile,
    communityId,
    channelId,
}: EventsHubClientProps) {
    const [viewMode, setViewMode] = useState<ViewMode>("calendar");
    const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [events, setEvents] = useState<Event[]>(initialEvents);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Filter events based on typeFilter
    const filteredEvents = useMemo(() => {
        if (typeFilter === "all") return events;
        return events.filter((event) => {
            if (typeFilter === "physical") return event.event_type === "physical";
            if (typeFilter === "online") {
                return event.event_type === "online_zoom" || event.event_type === "welldo_live";
            }
            return true;
        });
    }, [events, typeFilter]);

    // Refetch events when month or type filter changes
    const handleMonthChange = async (newMonth: Date) => {
        setCurrentMonth(newMonth);
        setIsLoading(true);
        try {
            const startDate = startOfMonth(newMonth).toISOString();
            const endDate = endOfMonth(addMonths(newMonth, 1)).toISOString(); // Fetch 2 months for calendar overlap
            const data = await getEventsForHub({
                typeFilter,
                startDate,
            });
            setEvents(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEventClick = (event: Event) => {
        setSelectedEvent(event);
        setDetailOpen(true);
    };

    const handleNewEvent = () => {
        setCreateModalOpen(true);
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
                onNewEvent={handleNewEvent}
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
                    <div className="h-full overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-full">
                            <EventsListView
                                events={filteredEvents}
                                onEventClick={handleEventClick}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Detail Panel */}
            <EventDetailPanel
                event={selectedEvent}
                open={detailOpen}
                onOpenChange={setDetailOpen}
                userId={userId}
                isAdmin={isAdmin}
            />

            {/* Create Event Modal */}
            {isAdmin && userProfile && communityId && channelId && (
                <CreateEventModal
                    isOpen={createModalOpen}
                    onClose={() => setCreateModalOpen(false)}
                    communityId={communityId}
                    channelId={channelId}
                    currentUser={{
                        full_name: userProfile.full_name,
                        avatar_url: userProfile.avatar_url,
                        iyzico_sub_merchant_key: (userProfile as any).iyzico_sub_merchant_key,
                    }}
                />
            )}
        </div>
    );
}
