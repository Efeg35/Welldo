"use client";

import { useState } from "react";
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
import { createLink } from "@/actions/links";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CreateLinkModalProps {
    isOpen: boolean;
    onClose: () => void;
    communityId: string;
}

export function CreateLinkModal({ isOpen, onClose, communityId }: CreateLinkModalProps) {
    const [title, setTitle] = useState("");
    const [url, setUrl] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !url) return;

        setIsLoading(true);
        try {
            await createLink(communityId, title, url);
            toast.success("Link başarıyla eklendi");
            setTitle("");
            setUrl("");
            onClose();
        } catch (error) {
            toast.error("Link eklenirken bir hata oluştu");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(val) => !isLoading && !val && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Yeni Link Ekle</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Link Başlığı</Label>
                        <Input
                            id="title"
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
                        <Label htmlFor="url">Link URL</Label>
                        <Input
                            id="url"
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
                                    Ekleniyor...
                                </>
                            ) : (
                                "Link Oluştur"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
