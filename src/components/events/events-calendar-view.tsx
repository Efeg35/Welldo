"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, MapPin, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    format,
    isSameMonth,
    isSameDay,
    isToday,
    addMonths,
    subMonths,
} from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { Event } from "@/types";

interface EventsCalendarViewProps {
    events: Event[];
    currentMonth: Date;
    setCurrentMonth: (date: Date) => void;
    onEventClick: (event: Event) => void;
}

const WEEKDAYS = ["PAZ", "PZT", "SAL", "ÇAR", "PER", "CUM", "CTS"];

export function EventsCalendarView({
    events,
    currentMonth,
    setCurrentMonth,
    onEventClick,
}: EventsCalendarViewProps) {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    // Group events by date
    const eventsByDate = useMemo(() => {
        const map = new Map<string, Event[]>();
        events.forEach((event) => {
            const dateKey = format(new Date(event.start_time), "yyyy-MM-dd");
            if (!map.has(dateKey)) {
                map.set(dateKey, []);
            }
            map.get(dateKey)!.push(event);
        });
        return map;
    }, [events]);

    const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

    return (
        <div className="flex flex-col h-full">
            {/* Month Navigation */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">
                    {format(currentMonth, "MMMM yyyy", { locale: tr })}
                </h2>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handlePrevMonth}
                        className="h-8 w-8 text-gray-500 hover:text-gray-700"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleNextMonth}
                        className="h-8 w-8 text-gray-500 hover:text-gray-700"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 overflow-auto">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 border-b border-gray-100">
                    {WEEKDAYS.map((day) => (
                        <div
                            key={day}
                            className="py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider"
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 divide-x divide-y divide-gray-100">
                    {days.map((day) => {
                        const dateKey = format(day, "yyyy-MM-dd");
                        const dayEvents = eventsByDate.get(dateKey) || [];
                        const isCurrentMonth = isSameMonth(day, currentMonth);
                        const isCurrentDay = isToday(day);

                        return (
                            <div
                                key={dateKey}
                                className={cn(
                                    "min-h-[120px] p-2 transition-colors",
                                    !isCurrentMonth && "bg-gray-50/50",
                                    isCurrentDay && "bg-blue-50/30"
                                )}
                            >
                                {/* Day Number */}
                                <div className="flex items-center justify-between mb-1">
                                    <span
                                        className={cn(
                                            "text-sm font-medium",
                                            !isCurrentMonth && "text-gray-400",
                                            isCurrentMonth && "text-gray-900",
                                            isCurrentDay &&
                                            "bg-gray-900 text-white w-7 h-7 rounded-full flex items-center justify-center"
                                        )}
                                    >
                                        {format(day, "d")}
                                    </span>
                                </div>

                                {/* Events */}
                                <div className="space-y-1">
                                    {dayEvents.slice(0, 3).map((event) => (
                                        <button
                                            key={event.id}
                                            onClick={() => onEventClick(event)}
                                            className="w-full text-left p-1.5 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors group"
                                        >
                                            <div className="flex items-center gap-1.5 text-xs">
                                                <span className="font-medium text-gray-700 truncate flex-1">
                                                    {event.title}
                                                </span>
                                                <span className="text-gray-500 shrink-0">
                                                    {format(new Date(event.start_time), "HH:mm")}
                                                </span>
                                                {event.event_type === "physical" ? (
                                                    <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                                                ) : (
                                                    <Video className="w-3 h-3 text-blue-500 shrink-0" />
                                                )}
                                                {event.ticket_price > 0 && (
                                                    <span className="text-green-600 font-bold shrink-0">₺</span>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                    {dayEvents.length > 3 && (
                                        <div className="text-xs text-gray-500 px-1.5">
                                            +{dayEvents.length - 3} daha
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
