"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateLink } from "@/actions/links";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface LinkItem {
    id: string;
    label: string;
    url: string;
}

interface EditLinkModalProps {
    isOpen: boolean;
    onClose: () => void;
    link: LinkItem | null;
}

export function EditLinkModal({ isOpen, onClose, link }: EditLinkModalProps) {
    const [title, setTitle] = useState("");
    const [url, setUrl] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (link) {
            setTitle(link.label);
            setUrl(link.url);
        }
    }, [link, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!link || !title || !url) return;

        setIsLoading(true);
        try {
            await updateLink(link.id, title, url);
            toast.success("Link başarıyla güncellendi");
            onClose();
        } catch (error) {
            toast.error("Link güncellenirken bir hata oluştu");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(val) => !isLoading && !val && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Linki Düzenle</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-title">Link Başlığı</Label>
                        <Input
                            id="edit-title"
                            placeholder="Örn: Websitemiz"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="col-span-3"
                            maxLength={20}
                            required
                        />
                        <p className="text-[10px] text-muted-foreground">Maksimum 20 karakter.</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-url">Link URL</Label>
                        <Input
                            id="edit-url"
                            placeholder="https://..."
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="col-span-3"
                            type="url"
                            required
                        />
                        <p className="text-[10px] text-muted-foreground">Link yeni sekmede açılacaktır.</p>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                            İptal
                        </Button>
                        <Button type="submit" disabled={isLoading} className="bg-[#1c1c1c] text-white hover:bg-black">
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Güncelleniyor...
                                </>
                            ) : (
                                "Güncelle"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
