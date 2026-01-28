"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { type ViewMode } from "./events-hub-header";

interface EventsHubSettingsPanelProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentSettings: any;
    onSave: (settings: any) => Promise<void>;
}

export function EventsHubSettingsPanel({
    open,
    onOpenChange,
    currentSettings,
    onSave,
}: EventsHubSettingsPanelProps) {
    const [defaultView, setDefaultView] = useState<ViewMode>(currentSettings?.default_view || "calendar");
    const [allowViewSwitch, setAllowViewSwitch] = useState<boolean>(
        currentSettings?.allow_view_switch !== undefined ? currentSettings.allow_view_switch : false
    );
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await onSave({
                ...currentSettings,
                default_view: defaultView,
                allow_view_switch: allowViewSwitch,
            });
            onOpenChange(false);
        } catch (error) {
            console.error("Error saving settings:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-[400px] flex flex-col p-0">
                <SheetHeader className="p-6 border-b">
                    <SheetTitle className="text-xl font-bold">Ayarlar</SheetTitle>
                </SheetHeader>

                <div className="flex-1 p-6 space-y-8">
                    {/* Default View Setting */}
                    <div className="space-y-3">
                        <Label className="text-sm font-semibold text-gray-900">Varsayılan Görünüm</Label>
                        <Select
                            value={defaultView}
                            onValueChange={(value: ViewMode) => setDefaultView(value)}
                        >
                            <SelectTrigger className="w-full h-10 rounded-lg border-gray-200">
                                <SelectValue placeholder="Varsayılan görünümü seçin" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="calendar" className="cursor-pointer">Takvim</SelectItem>
                                <SelectItem value="list" className="cursor-pointer">Liste</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Allow View Switch Setting */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-sm font-semibold text-gray-900">
                                Üyelerin görünümü değiştirmesine izin ver
                            </Label>
                            <p className="text-xs text-gray-500">
                                Devre dışı bırakılırsa üyeler yalnızca varsayılan görünümü görecektir.
                            </p>
                        </div>
                        <Switch
                            checked={allowViewSwitch}
                            onCheckedChange={setAllowViewSwitch}
                        />
                    </div>
                </div>

                <SheetFooter className="p-6 mt-auto border-t">
                    <Button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="w-full bg-[#1c1c1c] hover:bg-black text-white h-11 rounded-lg font-medium transition-all"
                    >
                        {isLoading ? "Kaydediliyor..." : "Ayarları kaydet"}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
