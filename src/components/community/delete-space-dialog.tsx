"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { Input } from "@/components/ui/input";
import { deleteChannel } from "@/actions/community";

interface DeleteSpaceDialogProps {
    isOpen: boolean;
    onClose: () => void;
    channelId: string;
    channelName: string;
}

export function DeleteSpaceDialog({ isOpen, onClose, channelId, channelName }: DeleteSpaceDialogProps) {
    const router = useRouter();
    const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await deleteChannel(channelId);
            toast.success("Alan silindi");
            onClose();
            router.push('/');
        } catch (error) {
            toast.error("Alan silinemedi");
            console.error(error);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !isDeleting && !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">"{channelName}" alanını silmek istediğinize emin misiniz?</DialogTitle>
                    <DialogDescription className="pt-2">
                        Devam ederseniz, bu alanla ilişkili <strong>TÜM verileri kalıcı olarak</strong> kaybedeceksiniz.
                        Bu işlem geri alınamaz.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-2">
                    <p className="text-sm text-gray-600 mb-2">
                        Onaylamak için lütfen kutucuğa <strong>SİLELİM</strong> yazın:
                    </p>
                    <Input
                        value={deleteConfirmationText}
                        onChange={(e) => setDeleteConfirmationText(e.target.value)}
                        placeholder="SİLELİM"
                        className="bg-white"
                        disabled={isDeleting}
                    />
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isDeleting}
                    >
                        İptal
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={deleteConfirmationText !== 'SİLELİM' || isDeleting}
                        className="bg-red-600 hover:bg-red-700 font-bold"
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Siliniyor...
                            </>
                        ) : (
                            'Onayla ve Sil'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
