import { useState, useEffect } from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface MembersPageSettingsSheetProps {
    open: boolean;
    onClose: () => void;
    currentSort?: string;
    currentView?: "grid" | "list";
    onSave: (settings: { defaultSort: string; defaultView: "grid" | "list" }) => void;
}

export function MembersPageSettingsSheet({
    open,
    onClose,
    currentSort = "newest",
    currentView = "grid",
    onSave
}: MembersPageSettingsSheetProps) {
    const [defaultSort, setDefaultSort] = useState(currentSort);
    const [defaultView, setDefaultView] = useState(currentView);

    // Update local state when props change
    useEffect(() => {
        setDefaultSort(currentSort);
        setDefaultView(currentView);
    }, [currentSort, currentView, open]);

    const handleSave = () => {
        onSave({ defaultSort, defaultView });
        onClose();
    };

    return (
        <Sheet open={open} onOpenChange={(open) => !open && onClose()}>
            <SheetContent side="right" className="w-[400px] sm:w-[540px] flex flex-col p-0">
                <SheetHeader className="p-6 border-b">
                    <SheetTitle className="text-xl font-bold">Ayarlar</SheetTitle>
                </SheetHeader>

                <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                    {/* Default Sort */}
                    <div className="space-y-3">
                        <Label className="text-sm font-semibold text-gray-900">Varsayılan Sıralama</Label>
                        <Select value={defaultSort} onValueChange={setDefaultSort}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Sıralama seçin" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="newest">En Yeni</SelectItem>
                                <SelectItem value="oldest">En Eski</SelectItem>
                                <SelectItem value="alphabetical">Alfabetik</SelectItem>
                                <SelectItem value="activity">Aktivite</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-sm font-semibold text-gray-900">Varsayılan Görünüm</Label>
                        <Select value={defaultView} onValueChange={(v) => setDefaultView(v as "grid" | "list")}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Görünüm seçin" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="grid">Kart Görünümü</SelectItem>
                                <SelectItem value="list">Liste Görünümü</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="p-6 mt-auto border-t bg-white">
                    <Button
                        className="w-full bg-[#1c1c1c] hover:bg-black text-white h-11 rounded-lg font-medium transition-all"
                        onClick={handleSave}
                    >
                        Ayarları kaydet
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
