"use client";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export function FeedFilter() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentSort = searchParams.get("sort") || "latest";

    const sortOptions = [
        { key: "latest", label: "En Yeniler" },
        { key: "oldest", label: "En Eskiler" },
        { key: "popular", label: "Popüler" },
        { key: "alphabetical", label: "Alfabetik" },
        // { key: "for_you", label: "Sizin İçin" }, // Complex to implement right now
        // { key: "new_activity", label: "Yeni Aktivite" }, // Same as latest mostly for MVP
    ];

    const currentLabel = sortOptions.find(o => o.key === currentSort)?.label || "En Yeniler";

    const handleSort = (key: string) => {
        const params = new URLSearchParams(searchParams);
        params.set("sort", key);
        router.push(`?${params.toString()}`);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-muted-foreground font-normal hover:bg-muted/50 rounded-lg h-9">
                    {currentLabel} <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                {sortOptions.map((option) => (
                    <DropdownMenuItem
                        key={option.key}
                        onClick={() => handleSort(option.key)}
                        className="cursor-pointer"
                    >
                        {option.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
