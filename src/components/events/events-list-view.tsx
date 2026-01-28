"use client";

import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { MapPin, Video, Clock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Event } from "@/types";

interface EventsListViewProps {
    events: Event[];
    onEventClick: (event: Event) => void;
    onRSVP?: (event: Event) => void;
}

export function EventsListView({ events, onEventClick, onRSVP }: EventsListViewProps) {
    if (events.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <Clock className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Etkinlik bulunamadı</h3>
                <p className="text-gray-500 text-sm">Filtreleri değiştirmeyi deneyin.</p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-gray-100">
            {events.map((event) => {
                const startDate = new Date(event.start_time);
                const isPhysical = event.event_type === "physical";

                return (
                    <div
                        key={event.id}
                        className="flex items-center gap-6 px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                        onClick={() => onEventClick(event)}
                    >
                        {/* Date Column */}
                        <div className="w-20 shrink-0 text-center">
                            <div className="text-2xl font-bold text-gray-900">
                                {format(startDate, "d")}
                            </div>
                            <div className="text-xs font-medium text-gray-500 uppercase">
                                {format(startDate, "MMM", { locale: tr })}
                            </div>
                        </div>

                        {/* Event Details */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-gray-900 truncate">
                                    {event.title}
                                </h3>
                                {isPhysical ? (
                                    <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                        <MapPin className="w-3 h-3" /> Yüzyüze
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                        <Video className="w-3 h-3" /> Online
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    {format(startDate, "HH:mm")}
                                </span>
                                {isPhysical && event.location_address && (
                                    <span className="flex items-center gap-1 truncate">
                                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                                        {event.location_address}
                                    </span>
                                )}
                                <span className="flex items-center gap-1 text-gray-400">
                                    <Globe className="w-3.5 h-3.5" />
                                    GMT+3
                                </span>
                            </div>
                        </div>

                        {/* Action Button */}
                        <div className="shrink-0">
                            {event.ticket_price > 0 ? (
                                <Button
                                    variant="default"
                                    size="sm"
                                    className="h-9 px-4 rounded-lg bg-gray-900 hover:bg-black text-white text-sm font-medium"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEventClick(event);
                                    }}
                                >
                                    ₺{event.ticket_price} - Bilet Al
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 px-4 rounded-lg border-gray-200 text-sm font-medium"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRSVP?.(event);
                                    }}
                                >
                                    RSVP
                                </Button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
