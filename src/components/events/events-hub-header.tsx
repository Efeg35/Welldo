"use client";

import { Button } from "@/components/ui/button";
import { Calendar, List, MapPin, Video, Plus, MoreHorizontal, Users, Lock, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { CheckCircle2 } from "lucide-react";

export type ViewMode = "calendar" | "list";
export type TypeFilter = "all" | "physical" | "online" | "paid";

interface EventsHubHeaderProps {
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    typeFilter: TypeFilter;
    setTypeFilter: (filter: TypeFilter) => void;
    isAdmin: boolean;
    canSwitchView?: boolean;
    onNewEvent: () => void;
    onOpenSettings: () => void;
    accessLevel?: 'open' | 'private' | 'secret';
    onAccessLevelChange?: (level: 'open' | 'private' | 'secret') => void;
}

export function EventsHubHeader({
    viewMode,
    setViewMode,
    typeFilter,
    setTypeFilter,
    isAdmin,
    canSwitchView = true,
    onNewEvent,
    onOpenSettings,
    accessLevel,
    onAccessLevelChange,
}: EventsHubHeaderProps) {
    return (
        <div className="flex items-center justify-between py-4 px-6 border-b border-gray-100 bg-white sticky top-0 z-20">
            {/* Left: Title */}
            <h1 className="text-xl font-bold text-gray-900">Etkinlikler</h1>

            {/* Right: Controls */}
            <div className="flex items-center gap-2">
                {/* View Mode Toggle */}
                {canSwitchView && (
                    <div className="flex items-center bg-gray-100 p-1 rounded-lg">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "h-7 w-8 p-0",
                                viewMode === "calendar" ? "bg-white shadow-sm" : "hover:bg-gray-200"
                            )}
                            onClick={() => setViewMode("calendar")}
                        >
                            <Calendar className="w-4 h-4 text-gray-600" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "h-7 w-8 p-0",
                                viewMode === "list" ? "bg-white shadow-sm" : "hover:bg-gray-200"
                            )}
                            onClick={() => setViewMode("list")}
                        >
                            <List className="w-4 h-4 text-gray-600" />
                        </Button>
                    </div>
                )}

                {/* Privacy Toggle (Admin Only) */}
                {isAdmin && accessLevel && onAccessLevelChange && (
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="h-9 gap-2 border-gray-200 hover:bg-gray-50 bg-white">
                                {accessLevel === 'open' ? (
                                    <>
                                        <Users className="w-4 h-4 text-gray-600" />
                                        <span className="text-sm font-medium text-gray-700">Herkese Açık</span>
                                    </>
                                ) : (
                                    <>
                                        <Lock className="w-4 h-4 text-gray-600" />
                                        <span className="text-sm font-medium text-gray-700">Gizli</span>
                                    </>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[320px] p-4" align="center" sideOffset={8}>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <h4 className="font-bold text-gray-900 leading-none">
                                        {accessLevel === 'open' ? "Bu alan herkese açık" : "Bu alan gizli"}
                                    </h4>
                                    <p className="text-sm text-gray-500 leading-relaxed">
                                        {accessLevel === 'open'
                                            ? "Bu sayfa şu an herkese açık ve tüm üyeler tarafından görülebilir. Gizli yaparsanız sadece yöneticiler görebilir."
                                            : "Bu sayfa şu an gizli ve sadece yöneticiler tarafından görülebilir. Herkese açık yaparsanız tüm üyeler görebilir."}
                                    </p>
                                </div>
                                <Button
                                    className="w-full bg-gray-900 hover:bg-black text-white rounded-lg h-10 font-medium"
                                    onClick={() => onAccessLevelChange(accessLevel === 'open' ? 'private' : 'open')}
                                >
                                    {accessLevel === 'open' ? "Gizli Yap" : "Herkese Açık Yap"}
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>
                )}

                {/* Filter Segmented Control */}
                <div className="hidden md:flex items-center bg-gray-100 rounded-lg p-1">
                    <button
                        onClick={() => setTypeFilter("all")}
                        className={cn(
                            "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                            typeFilter === "all"
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-900"
                        )}
                    >
                        Tümü
                    </button>
                    <button
                        onClick={() => setTypeFilter("physical")}
                        className={cn(
                            "px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1.5",
                            typeFilter === "physical"
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-900"
                        )}
                    >
                        <MapPin className="w-3.5 h-3.5" />
                        Fiziksel
                    </button>
                    <button
                        onClick={() => setTypeFilter("online")}
                        className={cn(
                            "px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1.5",
                            typeFilter === "online"
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-900"
                        )}
                    >
                        <Video className="w-3.5 h-3.5" />
                        Online
                    </button>
                    <button
                        onClick={() => setTypeFilter("paid")}
                        className={cn(
                            "px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1.5",
                            typeFilter === "paid"
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-900"
                        )}
                    >
                        <div className="w-3.5 h-3.5 flex items-center justify-center font-bold text-xs">₺</div>
                        Biletli
                    </button>
                </div>

                {/* Mobile Filter Fallback (could be distinct, but utilizing same logic if needed or keep hidden on small screens and use bottom sheet - simplistic approach here) */}

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
                        <DropdownMenuItem onClick={onOpenSettings} className="cursor-pointer">
                            Ayarlar
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
