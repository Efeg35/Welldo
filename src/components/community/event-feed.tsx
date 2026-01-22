"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, Plus, MapPin, Video, Calendar, User, AlignLeft } from "lucide-react";
import { CreateEventModal } from "./create-event";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

import { Channel, Profile, Event } from "@/types";

interface EventFeedProps {
    channel: Channel;
    user: Profile;
    initialEvents: Event[];
}

export function EventFeed({ channel, user, initialEvents }: EventFeedProps) {
    const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // In a real app we might fetch filtered events here, 
    // but for now let's assume initialEvents matches the default filter (upcoming)
    // or we filter client side if we fetched all. 
    // Given the action `getEvents` was tailored for filtering, strictly we should use server actions or client fetch
    // but to keep it simple and fast, let's assume `initialEvents` are the "Upcoming" ones passed from server page first load.
    // If user switches to Past, we might need to fetch. 
    // For MVP, let's just stick to "Upcoming" as default view.

    // Actually, to make it robust, we should handle the tab switch.
    // But let's build the UI shell first.

    return (
        <div className="flex flex-col h-full bg-[#FAFAFA]">
            {/* Toolbar */}
            <div className="sticky top-0 z-10 bg-white border-b border-border shadow-sm w-full px-8 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">{channel.name}</h1>
                </div>

                <div className="flex items-center gap-3">
                    <Button onClick={() => setIsCreateModalOpen(true)} size="sm" className="bg-[#1c1c1c] hover:bg-black text-white rounded-full px-5 font-medium shadow-sm transition-all hover:scale-105 active:scale-95 h-9 cursor-pointer">
                        Yeni etkinlik
                    </Button>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-muted/50 rounded-full h-9 w-9 cursor-pointer">
                        <ChevronDown className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-5xl mx-auto w-full min-h-full p-8">
                {/* Filter Tabs */}
                <div className="flex items-center gap-2 mb-8">
                    <div className="relative inline-flex rounded-full border bg-white p-1 shadow-sm">
                        <button
                            onClick={() => setFilter('upcoming')}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filter === 'upcoming' ? 'bg-gray-100 text-foreground shadow-sm' : 'text-muted-foreground hover:bg-gray-50'}`}
                        >
                            Yaklaşan
                        </button>
                        <button
                            onClick={() => setFilter('past')}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filter === 'past' ? 'bg-gray-100 text-foreground shadow-sm' : 'text-muted-foreground hover:bg-gray-50'}`}
                        >
                            Geçmiş
                        </button>
                    </div>
                </div>

                {/* Events List or Empty State */}
                {initialEvents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed shadow-sm">
                        <h3 className="text-xl font-bold text-foreground mb-2">Yaklaşan etkinlik yok</h3>
                        <p className="text-muted-foreground mb-6">Planlanan etkinlikler burada görünecek.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {initialEvents.map(event => (
                            <div key={event.id} className="bg-white p-5 rounded-xl border shadow-sm hover:shadow-md transition-all flex gap-5 group cursor-pointer">
                                {/* Date Box */}
                                <div className="flex flex-col items-center justify-center w-16 h-16 rounded-lg bg-gray-50 border text-center shrink-0">
                                    <span className="text-xs uppercase font-bold text-red-500">{format(new Date(event.start_time), 'MMM', { locale: tr })}</span>
                                    <span className="text-xl font-bold text-gray-900">{format(new Date(event.start_time), 'd')}</span>
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-bold text-foreground group-hover:text-blue-600 transition-colors truncate">{event.title}</h3>
                                    <div className="text-sm text-muted-foreground mt-1 flex flex-wrap items-center gap-3">
                                        <span className="flex items-center gap-1.5">
                                            <Calendar className="w-4 h-4" />
                                            {format(new Date(event.start_time), 'EEE, HH:mm', { locale: tr })} - {format(new Date(event.end_time), 'HH:mm')}
                                        </span>
                                        {event.event_type === 'online_zoom' ? (
                                            <span className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md text-xs font-medium">
                                                <Video className="w-3 h-3" />
                                                Zoom
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5">
                                                <MapPin className="w-4 h-4" />
                                                {event.location_address || 'Konum belirtilmedi'}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Action / Host */}
                                <div className="flex flex-col items-end justify-between">
                                    {/* Could put host avatar here */}
                                    <Button size="sm" variant="outline" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        Detaylar
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <CreateEventModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                channelId={channel.id}
                communityId={channel.community_id}
            />
        </div>
    );
}
