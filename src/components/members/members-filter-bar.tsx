"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import {
    Plus,
    MapPin,
    User,
    Users,
    Tag,
    Calendar,
    Trophy,
    X,
    Activity
} from "lucide-react";

export interface ActiveFilter {
    id: string;
    label: string;
    value: string;
    displayValue: string;
}

interface MembersFilterBarProps {
    activeFilters: ActiveFilter[];
    onAddFilter: (filter: ActiveFilter) => void;
    onRemoveFilter: (filterId: string) => void;
    availableSpaces?: { id: string; name: string }[];
    upcomingEvents?: { id: string; title: string; start_time: string }[];
    onNearMeClick?: () => void;
    isNearMeActive?: boolean;
}

interface FilterDefinition {
    id: string;
    label: string;
    icon: any;
    type: 'text' | 'select';
    options?: { value: string; label: string }[];
}

const baseFilterDefinitions: FilterDefinition[] = [
    { id: "name", label: "İsim", icon: User, type: "text" },
    {
        id: "role",
        label: "Rol",
        icon: Users,
        type: "select",
        options: [
            { value: "admin", label: "Yönetici" },
            { value: "instructor", label: "Eğitmen" },
            { value: "member", label: "Üye" },
        ]
    },
    {
        id: "access",
        label: "Alan erişimi",
        icon: Users,
        type: "select",
        options: [] // To be populated dynamically
    },
    {
        id: "rsvp",
        label: "Etkinlik",
        icon: Calendar,
        type: "select",
        options: [] // To be populated dynamically
    },
    {
        id: "status",
        label: "Durum",
        icon: Activity,
        type: "select",
        options: [
            { value: "online", label: "Çevrimiçi" },
            { value: "offline", label: "Çevrimdışı" },
        ]
    },
    { id: "location", label: "Konum", icon: MapPin, type: "text" },
];

function FilterPopover({
    filter,
    onApply,
    children
}: {
    filter: FilterDefinition;
    onApply: (value: string, displayValue: string) => void;
    children: React.ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState("");

    const handleApply = (value: string, display?: string) => {
        onApply(value, display || value);
        setOpen(false);
        setInputValue("");
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                {children}
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="start">
                <div className="space-y-3">
                    <div className="text-sm font-medium text-gray-900">
                        {filter.id === 'access' ? 'Filtrele: Alanlar' : `${filter.label} ile filtrele`}
                    </div>

                    {filter.type === "text" && (
                        <div className="space-y-2">
                            <Input
                                placeholder={`${filter.label} girin...`}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                className="h-9 focus-visible:ring-0 focus-visible:border-gray-400"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && inputValue.trim()) {
                                        handleApply(inputValue);
                                    }
                                }}
                            />
                            <Button
                                size="sm"
                                className="w-full bg-black text-white hover:bg-black/90"
                                onClick={() => handleApply(inputValue)}
                                disabled={!inputValue.trim()}
                            >
                                Uygula
                            </Button>
                        </div>
                    )}

                    {filter.type === "select" && filter.options && (
                        <div className="space-y-1 max-h-60 overflow-y-auto">
                            {filter.options.map((option) => (
                                <button
                                    key={option.value}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors hover:bg-black hover:text-white text-left text-gray-700"
                                    onClick={() => handleApply(option.value, option.label)}
                                >
                                    <span className="truncate">{option.label}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}

export function MembersFilterBar({ activeFilters, onAddFilter, onRemoveFilter, availableSpaces = [], upcomingEvents = [], onNearMeClick, isNearMeActive }: MembersFilterBarProps) {
    const [addFilterOpen, setAddFilterOpen] = useState(false);

    // Create dynamic filters with current available spaces
    const filters = useMemo(() => {
        return baseFilterDefinitions.map(def => {
            if (def.id === 'access') {
                return {
                    ...def,
                    options: availableSpaces.map(s => ({ value: s.id, label: s.name }))
                };
            }
            if (def.id === 'rsvp') {
                return {
                    ...def,
                    options: upcomingEvents.map(e => ({
                        value: e.id,
                        label: `${new Date(e.start_time).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} - ${e.title}`
                    }))
                };
            }
            return def;
        });
    }, [availableSpaces, upcomingEvents]);

    // Get filters that are not yet active AND not shown as quick buttons
    // Since we are showing all filters as quick buttons, this will be empty effectively unless more are added
    const availableFiltersList = filters.filter(
        f => !activeFilters.some(af => af.id === f.id) && false // Hide from dropdown as they are all buttons now
    );

    const handleAddFilter = (filter: FilterDefinition, value: string, displayValue: string) => {
        onAddFilter({
            id: filter.id,
            label: filter.label,
            value,
            displayValue
        });
    };

    return (
        <div className="flex items-center gap-2 overflow-x-auto py-2 scrollbar-hide">
            {/* Near Me Button */}
            <Button
                variant="outline"
                size="sm"
                className={`rounded-full gap-2 h-8 px-4 font-normal shadow-sm shrink-0 transition-colors ${isNearMeActive
                    ? "bg-gray-900 text-white hover:bg-gray-800 border-gray-900"
                    : "bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-gray-200"
                    }`}
                onClick={onNearMeClick}
            >
                <MapPin className={`w-3.5 h-3.5 ${isNearMeActive ? "opacity-100" : "opacity-70"}`} />
                Yakınımdakiler
            </Button>

            {/* Active Filters */}
            {activeFilters.map((filter) => (
                <div
                    key={filter.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-full text-sm font-medium shrink-0"
                >
                    <span className="truncate max-w-[150px]">{filter.label}: {filter.displayValue}</span>
                    <button
                        onClick={() => onRemoveFilter(filter.id)}
                        className="hover:bg-white/20 rounded-full p-0.5"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            ))}

            {/* Available Filter Buttons - Show all filters directly */}
            {filters.map((filter) => {
                const isActive = activeFilters.some(af => af.id === filter.id);
                if (isActive) return null;

                return (
                    <FilterPopover
                        key={filter.id}
                        filter={filter}
                        onApply={(value, displayValue) => handleAddFilter(filter, value, displayValue)}
                    >
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full gap-2 border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 bg-white h-8 px-4 font-normal shadow-sm shrink-0"
                        >
                            <filter.icon className="w-3.5 h-3.5 opacity-70" />
                            {filter.label}
                        </Button>
                    </FilterPopover>
                );
            })}

            {/* Add Filter Dropdown */}
            {availableFiltersList.length > 0 && (
                <Popover open={addFilterOpen} onOpenChange={setAddFilterOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-full gap-2 text-gray-500 hover:text-gray-900 h-8 px-4 font-medium shrink-0"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Filtre ekle
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-2" align="start">
                        <div className="space-y-1">
                            {availableFiltersList.map((filter) => (
                                <FilterPopover
                                    key={filter.id}
                                    filter={filter}
                                    onApply={(value, displayValue) => {
                                        handleAddFilter(filter, value, displayValue);
                                        setAddFilterOpen(false);
                                    }}
                                >
                                    <button
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-gray-100 text-left"
                                    >
                                        <filter.icon className="w-4 h-4 text-gray-500" />
                                        {filter.label}
                                    </button>
                                </FilterPopover>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>
            )}
        </div>
    );
}
