"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Mail, UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AddMemberModalProps {
    open: boolean;
    onClose: () => void;
    communityId: string;
    onSuccess?: () => void;
}

export function AddMemberModal({ open, onClose, communityId, onSuccess }: AddMemberModalProps) {
    const [emails, setEmails] = useState("");
    const [role, setRole] = useState("member");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!emails.trim()) {
            toast.error("Lütfen en az bir e-posta adresi girin");
            return;
        }

        setIsSubmitting(true);

        try {
            // Parse emails (comma or newline separated)
            const emailList = emails
                .split(/[,\n]/)
                .map(e => e.trim())
                .filter(e => e.length > 0);

            // Validate emails
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const invalidEmails = emailList.filter(e => !emailRegex.test(e));

            if (invalidEmails.length > 0) {
                toast.error(`Geçersiz e-posta: ${invalidEmails[0]}`);
                setIsSubmitting(false);
                return;
            }

            // TODO: Call server action to send invitations
            // await inviteMembers(communityId, emailList, role, message);

            // For now, just show success
            toast.success(`${emailList.length} kişiye davet gönderildi`);

            // Reset form
            setEmails("");
            setRole("member");
            setMessage("");
            onClose();
            onSuccess?.();

        } catch (error) {
            console.error(error);
            toast.error("Davet gönderilemedi");
        }

        setIsSubmitting(false);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5" />
                        Üye Ekle
                    </DialogTitle>
                    <DialogDescription>
                        E-posta adresleri ile yeni üyeler davet edin
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="emails">E-posta Adresleri</Label>
                        <Textarea
                            id="emails"
                            placeholder="ornek@email.com, baska@email.com..."
                            value={emails}
                            onChange={(e) => setEmails(e.target.value)}
                            rows={3}
                            className="resize-none"
                        />
                        <p className="text-xs text-muted-foreground">
                            Birden fazla e-posta için virgül veya yeni satır kullanın
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="role">Rol</Label>
                        <Select value={role} onValueChange={setRole}>
                            <SelectTrigger>
                                <SelectValue placeholder="Rol seçin" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="member">Üye</SelectItem>
                                <SelectItem value="instructor">Eğitmen</SelectItem>
                                <SelectItem value="admin">Yönetici</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="message">Kişisel Mesaj (Opsiyonel)</Label>
                        <Textarea
                            id="message"
                            placeholder="Davet mesajınız..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={2}
                            className="resize-none"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        İptal
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2">
                        {isSubmitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Mail className="w-4 h-4" />
                        )}
                        Davet Gönder
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
