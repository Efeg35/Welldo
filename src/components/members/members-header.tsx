"use client";

import { Button } from "@/components/ui/button";
import { LayoutGrid, List, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface MembersHeaderProps {
    viewMode: "grid" | "list";
    onChangeViewMode: (mode: "grid" | "list") => void;
    onSearch: (query: string) => void;
    isAdmin: boolean;
}

export function MembersHeader({ viewMode, onChangeViewMode, onSearch, isAdmin }: MembersHeaderProps) {
    return (
        <div className="flex flex-col gap-3 mb-2">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Üyeler</h1>

                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-muted/50 rounded-lg p-1 border border-border">
                        <button
                            onClick={() => onChangeViewMode("grid")}
                            className={`p-2 rounded-md transition-all ${viewMode === "grid"
                                ? "bg-white shadow-sm text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                            title="Grid View"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onChangeViewMode("list")}
                            className={`p-2 rounded-md transition-all ${viewMode === "list"
                                ? "bg-white shadow-sm text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                            title="List View"
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>

                    {isAdmin && (
                        <div className="flex items-center gap-2 ml-2">
                            <Button variant="outline">Public</Button>
                            <Button variant="default" className="bg-black text-white hover:bg-black/90">
                                Yönet
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Ara..."
                    className="pl-9 bg-muted/30 border-border max-w-md rounded-full"
                    onChange={(e) => onSearch(e.target.value)}
                />
            </div>
        </div>
    );
}
