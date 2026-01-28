"use client";

import { Button } from "@/components/ui/button";
import { Calendar, List, MapPin, Video, Plus, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type ViewMode = "calendar" | "list";
export type TypeFilter = "all" | "physical" | "online";

interface EventsHubHeaderProps {
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    typeFilter: TypeFilter;
    setTypeFilter: (filter: TypeFilter) => void;
    isAdmin: boolean;
    onNewEvent: () => void;
}

export function EventsHubHeader({
    viewMode,
    setViewMode,
    typeFilter,
    setTypeFilter,
    isAdmin,
    onNewEvent,
}: EventsHubHeaderProps) {
    return (
        <div className="flex items-center justify-between py-4 px-6 border-b border-gray-100 bg-white sticky top-0 z-20">
            {/* Left: Title */}
            <h1 className="text-xl font-bold text-gray-900">Etkinlikler</h1>

            {/* Right: Controls */}
            <div className="flex items-center gap-3">
                {/* View Toggle */}
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                    <button
                        onClick={() => setViewMode("calendar")}
                        className={cn(
                            "p-2 rounded-md transition-colors",
                            viewMode === "calendar"
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                        )}
                        title="Takvim Görünümü"
                    >
                        <Calendar className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setViewMode("list")}
                        className={cn(
                            "p-2 rounded-md transition-colors",
                            viewMode === "list"
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                        )}
                        title="Liste Görünümü"
                    >
                        <List className="w-4 h-4" />
                    </button>
                </div>

                {/* Type Filter Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="h-9 px-3 rounded-lg border-gray-200 text-sm font-medium">
                            {typeFilter === "all" && "Tümü"}
                            {typeFilter === "physical" && (
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5" /> Yüzyüze
                                </span>
                            )}
                            {typeFilter === "online" && (
                                <span className="flex items-center gap-1.5">
                                    <Video className="w-3.5 h-3.5" /> Online
                                </span>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => setTypeFilter("all")}>
                            Tümü
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTypeFilter("physical")}>
                            <MapPin className="w-4 h-4 mr-2" /> Yüzyüze
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTypeFilter("online")}>
                            <Video className="w-4 h-4 mr-2" /> Online
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* New Event Button (Admin Only) */}
                {isAdmin && (
                    <Button
                        onClick={onNewEvent}
                        className="h-9 px-4 rounded-lg bg-gray-900 hover:bg-black text-white text-sm font-medium gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Yeni Etkinlik
                    </Button>
                )}

                {/* More Options */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-500 hover:text-gray-700">
                            <MoreHorizontal className="w-5 h-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem>Ayarlar</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
