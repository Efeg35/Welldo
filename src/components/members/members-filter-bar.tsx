"use client";

import { useState } from "react";
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
    Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserRole } from "@/types/database";

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
}

interface FilterDefinition {
    id: string;
    label: string;
    icon: any;
    type: 'text' | 'select' | 'range';
    options?: { value: string; label: string }[];
}

const filterDefinitions: FilterDefinition[] = [
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
    { id: "tag", label: "Etiket", icon: Tag, type: "text" },
    { id: "rsvp", label: "Etkinlik LCV", icon: Calendar, type: "text" },
    {
        id: "score",
        label: "Aktivite puanı",
        icon: Trophy,
        type: "select",
        options: [
            { value: "high", label: "Yüksek (8+)" },
            { value: "medium", label: "Orta (4-7)" },
            { value: "low", label: "Düşük (0-3)" },
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
                        {filter.label} ile filtrele
                    </div>

                    {filter.type === "text" && (
                        <div className="space-y-2">
                            <Input
                                placeholder={`${filter.label} girin...`}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                className="h-9"
                            />
                            <Button
                                size="sm"
                                className="w-full"
                                onClick={() => handleApply(inputValue)}
                                disabled={!inputValue.trim()}
                            >
                                Uygula
                            </Button>
                        </div>
                    )}

                    {filter.type === "select" && filter.options && (
                        <div className="space-y-1">
                            {filter.options.map((option) => (
                                <button
                                    key={option.value}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-gray-100 text-left"
                                    onClick={() => handleApply(option.value, option.label)}
                                >
                                    <Check className="w-4 h-4 opacity-0" />
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}

export function MembersFilterBar({ activeFilters, onAddFilter, onRemoveFilter }: MembersFilterBarProps) {
    const [addFilterOpen, setAddFilterOpen] = useState(false);

    // Get filters that are not yet active
    const availableFilters = filterDefinitions.filter(
        f => !activeFilters.some(af => af.id === f.id)
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
            {/* Active Filters */}
            {activeFilters.map((filter) => (
                <div
                    key={filter.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-full text-sm font-medium"
                >
                    <span>{filter.label}: {filter.displayValue}</span>
                    <button
                        onClick={() => onRemoveFilter(filter.id)}
                        className="hover:bg-white/20 rounded-full p-0.5"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            ))}

            {/* Available Filter Buttons */}
            {filterDefinitions.slice(0, 4).map((filter) => {
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
            {availableFilters.length > 0 && (
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
                            {availableFilters.map((filter) => (
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
