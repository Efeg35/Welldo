"use client";


import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List, Search, MoreHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
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
import { Users, Lock, Settings } from "lucide-react";
import { MembersPageSettingsSheet } from "./members-page-settings-sheet";

interface MembersHeaderProps {
    viewMode: "grid" | "list";
    onChangeViewMode: (mode: "grid" | "list") => void;
    onSearch: (query: string) => void;
    isAdmin: boolean;
    onAddMember?: () => void;
    onManage?: () => void;
    accessLevel?: 'open' | 'private';
    onAccessLevelChange?: (level: 'open' | 'private') => void;
    communityName?: string;
    communityId: string;
    currentSort?: string;
    onSettingsSave?: (settings: { defaultSort: string; defaultView: "grid" | "list" }) => void;
}

export function MembersHeader({
    viewMode,
    onChangeViewMode,
    onSearch,
    isAdmin,
    onAddMember,
    onManage,
    accessLevel = 'open',
    onAccessLevelChange,
    communityName = "WellDo", // Default fallback
    communityId,
    currentSort = "newest",
    onSettingsSave
}: MembersHeaderProps) {
    const [showSettings, setShowSettings] = useState(false);

    return (
        <div className="flex flex-col gap-3 mb-2">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Üyeler</h1>

                <div className="flex items-center gap-2">
                    {/* View Toggle */}
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
                                            onClick={() => onAccessLevelChange?.(accessLevel === 'open' ? 'private' : 'open')}
                                        >
                                            {accessLevel === 'open' ? "Gizli Yap" : "Herkese Açık Yap"}
                                        </Button>
                                    </div>
                                </PopoverContent>
                            </Popover>



                            <Button
                                variant="default"
                                className="bg-black text-white hover:bg-black/90 h-9 px-4 hidden md:flex"
                                onClick={onManage}
                            >
                                Yönet
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setShowSettings(true)}>
                                        <Settings className="w-4 h-4 mr-2" />
                                        Ayarlar
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <MembersPageSettingsSheet
                                open={showSettings}
                                onClose={() => setShowSettings(false)}
                                currentSort={currentSort}
                                currentView={viewMode}
                                onSave={onSettingsSave || (() => { })}
                            />
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
        </div >
    );
}
