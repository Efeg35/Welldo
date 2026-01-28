"use client";

import { Button } from "@/components/ui/button";
import { Plus, MapPin, Users, Tag, Calendar, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterOption {
    id: string;
    label: string;
    icon?: any;
}

const filters: FilterOption[] = [
    { id: "near_me", label: "Yakınımda", icon: MapPin },
    { id: "name", label: "İsim", icon: Plus },
    { id: "access", label: "Alan erişimi", icon: Users },
    { id: "tag", label: "Etiket", icon: Tag },
    { id: "rsvp", label: "Etkinlik LCV", icon: Calendar },
    { id: "score", label: "Aktivite puanı", icon: Trophy },
];

export function MembersFilterBar() {
    return (
        <div className="flex items-center gap-3 overflow-x-auto py-2 scrollbar-hide">
            {filters.map((filter) => (
                <Button
                    key={filter.id}
                    variant="outline"
                    size="sm"
                    className="rounded-full gap-2 border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 bg-white h-8 px-4 font-normal shadow-sm"
                >
                    {filter.icon && <filter.icon className="w-3.5 h-3.5 opacity-70" />}
                    {filter.label}
                </Button>
            ))}
            <Button
                variant="ghost"
                size="sm"
                className="rounded-full gap-2 text-gray-500 hover:text-gray-900 h-8 px-4 font-medium"
            >
                <Plus className="w-3.5 h-3.5" />
                Filtre ekle
            </Button>
        </div>
    );
}
