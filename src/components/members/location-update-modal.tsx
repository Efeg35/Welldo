"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { updateUserLocation } from "@/actions/profile";
import { toast } from "sonner";

interface LocationUpdateModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: (location: string) => void;
}

export function LocationUpdateModal({ open, onClose, onSuccess }: LocationUpdateModalProps) {
    const [location, setLocation] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async () => {
        if (!location.trim()) return;

        setIsLoading(true);
        try {
            await updateUserLocation(location);
            toast.success("Konum başarıyla güncellendi");
            onSuccess(location);
        } catch (error) {
            console.error(error);
            toast.error("Konum güncellenemedi");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">Yakınınızdaki üyeleri keşfedin</DialogTitle>
                    <DialogDescription className="text-gray-500 mt-2">
                        Yakınınızdaki topluluk üyeleriyle bağlantı kurun. Bu özelliği kullanmak için lütfen konumunuzu güncelleyin.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <label htmlFor="location" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Konum
                        </label>
                        <Input
                            id="location"
                            placeholder="örn. İstanbul, Kadıköy"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                </div>

                <DialogFooter className="flex gap-2 sm:justify-end">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isLoading}
                        className="rounded-full"
                    >
                        Şimdi değil
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={!location.trim() || isLoading}
                        className="rounded-full bg-black text-white hover:bg-black/90"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Kaydediliyor...
                            </>
                        ) : (
                            "Konumu kaydet"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
