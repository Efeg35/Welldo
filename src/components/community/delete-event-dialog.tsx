"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";

interface DeleteEventDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
}

export function DeleteEventDialog({ isOpen, onClose, onConfirm }: DeleteEventDialogProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleConfirm = async () => {
        setIsDeleting(true);
        try {
            await onConfirm();
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !isDeleting && !open && onClose()}>
            <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
                <div className="p-6">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-xl font-bold text-gray-900 leading-tight">
                            Bu etkinliği silmek istediğinize emin misiniz?
                        </DialogTitle>
                        <DialogDescription className="text-gray-500 pt-2 text-sm leading-relaxed">
                            Bu etkinlik kalıcı olarak kaldırılacak ve geri alınamayacaktır.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="flex items-center gap-3 sm:justify-end mt-2">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={isDeleting}
                            className="rounded-full px-6 font-medium border-gray-200 text-gray-700 hover:bg-gray-50 h-10 transition-all"
                        >
                            İptal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirm}
                            disabled={isDeleting}
                            className="bg-[#D93025] hover:bg-[#b9281e] text-white rounded-full px-6 font-medium h-10 transition-all shadow-md"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Siliniyor...
                                </>
                            ) : (
                                'Silmeyi Onayla'
                            )}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
