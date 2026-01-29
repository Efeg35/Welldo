"use client";

import { inviteMembers } from "@/actions/invite-member";
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Plus, X, Loader2, ArrowLeft, Trash2, Link as LinkIcon, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AddMemberModalProps {
    open: boolean;
    onClose: () => void;
    communityId: string;
    onSuccess?: () => void;
}

interface MemberRow {
    id: string;
    name: string;
    email: string;
}

export function AddMemberModal({ open, onClose, communityId, onSuccess }: AddMemberModalProps) {
    const [inviteMethod, setInviteMethod] = useState<"email" | "link" | null>(null);
    const [members, setMembers] = useState<MemberRow[]>([
        { id: crypto.randomUUID(), name: "", email: "" }
    ]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddMember = () => {
        setMembers([...members, { id: crypto.randomUUID(), name: "", email: "" }]);
    };

    const handleRemoveMember = (id: string) => {
        if (members.length > 1) {
            setMembers(members.filter(m => m.id !== id));
        }
    };

    const handleMemberChange = (id: string, field: "name" | "email", value: string) => {
        setMembers(members.map(m => m.id === id ? { ...m, [field]: value } : m));
    };

    const handleSubmit = async () => {
        // Validate
        const validMembers = members.filter(m => m.email.trim());

        if (validMembers.length === 0) {
            toast.error("Lütfen en az bir e-posta adresi girin");
            return;
        }

        // Validate emails
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const invalidMember = validMembers.find(m => !emailRegex.test(m.email));

        if (invalidMember) {
            toast.error(`Geçersiz e-posta: ${invalidMember.email}`);
            return;
        }

        setIsSubmitting(true);

        try {
            // Prepare inputs for the action
            const memberInputs = validMembers.map(m => ({
                email: m.email,
                name: m.name.trim() || undefined
            }));

            await inviteMembers(communityId, memberInputs, "member", "");

            toast.success(`${validMembers.length} kişiye davet gönderildi`);

            // Reset
            setInviteMethod(null);
            setMembers([{ id: crypto.randomUUID(), name: "", email: "" }]);
            onClose();
            onSuccess?.();
        } catch (error) {
            console.error(error);
            toast.error("Davet gönderilemedi");
        }

        setIsSubmitting(false);
    };

    const handleCopyLink = () => {
        const link = `${window.location.origin}/join/${communityId}`;
        navigator.clipboard.writeText(link);
        toast.success("Davet linki kopyalandı");
    };

    const handleReset = () => {
        setInviteMethod(null);
        setMembers([{ id: crypto.randomUUID(), name: "", email: "" }]);
    };

    const inviteLink = typeof window !== 'undefined' ? `${window.location.origin}/join/${communityId}` : '';

    return (
        <Dialog open={open} onOpenChange={(open) => {
            if (!open) {
                handleReset();
                onClose();
            }
        }}>
            <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden bg-background rounded-2xl shadow-xl border border-border">
                {/* Header */}
                <div className="px-6 py-5 border-b border-border flex items-center gap-3 bg-card/50">
                    {inviteMethod && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleReset}
                            className="-ml-2 h-8 w-8 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    )}
                    <DialogTitle className="text-xl font-bold tracking-tight">
                        {inviteMethod === "email" ? "E-posta ile Davet Et" : inviteMethod === "link" ? "Davet Linki" : "Üye Davet Et"}
                    </DialogTitle>
                </div>

                <div className="p-6">
                    {/* Invite Method Selection */}
                    {!inviteMethod && (
                        <div className="grid gap-6">
                            <p className="text-muted-foreground text-sm">
                                Topluluğunuza yeni üyeler eklemek için bir yöntem seçin.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button
                                    onClick={() => setInviteMethod("email")}
                                    className="flex flex-col items-start gap-4 p-5 rounded-xl border border-border bg-card hover:border-gray-400 hover:bg-muted/50 transition-all text-left group relative overflow-hidden"
                                >
                                    <div className="p-3 bg-gray-100 text-gray-900 rounded-lg group-hover:bg-gray-200 transition-colors">
                                        <Mail className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <span className="font-semibold text-foreground block mb-1.5">E-posta Daveti</span>
                                        <span className="text-sm text-muted-foreground block leading-relaxed">
                                            Kişileri tek tek ekleyin ve özel mesaj gönderin.
                                        </span>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setInviteMethod("link")}
                                    className="flex flex-col items-start gap-4 p-5 rounded-xl border border-border bg-card hover:border-gray-400 hover:bg-muted/50 transition-all text-left group relative overflow-hidden"
                                >
                                    <div className="p-3 bg-gray-100 text-gray-900 rounded-lg group-hover:bg-gray-200 transition-colors">
                                        <LinkIcon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <span className="font-semibold text-foreground block mb-1.5">Davet Linki</span>
                                        <span className="text-sm text-muted-foreground block leading-relaxed">
                                            WhatsApp veya Telegram grupları için hızlı paylaşım linki.
                                        </span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Email Invite Form */}
                    {inviteMethod === "email" && (
                        <div className="space-y-6">
                            <div className="space-y-4">
                                {/* Member Rows */}
                                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 -mr-2">
                                    {members.map((member) => (
                                        <div key={member.id} className="grid grid-cols-[1fr,1.5fr,auto] gap-3 items-start group animate-in fade-in slide-in-from-top-2 duration-200">
                                            <Input
                                                placeholder="İsim"
                                                value={member.name}
                                                onChange={(e) => handleMemberChange(member.id, "name", e.target.value)}
                                                className="h-11 bg-muted/30 border-border focus:bg-background transition-colors rounded-lg"
                                            />
                                            <Input
                                                type="email"
                                                placeholder="ornek@email.com"
                                                value={member.email}
                                                onChange={(e) => handleMemberChange(member.id, "email", e.target.value)}
                                                className={cn(
                                                    "h-11 bg-muted/30 border-border focus:bg-background transition-colors rounded-lg",
                                                    !member.email && members.length > 1 && "border-red-200 focus:border-red-300 ring-red-200"
                                                )}
                                            />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleRemoveMember(member.id)}
                                                disabled={members.length <= 1}
                                                className={cn(
                                                    "h-11 w-11 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors",
                                                    members.length <= 1 && "opacity-0 cursor-default"
                                                )}
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>

                                {/* Add Another Member Wrapper */}
                                <div className="pt-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleAddMember}
                                        className="gap-2 h-10 border-dashed border-border hover:border-gray-400 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg w-full sm:w-auto"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Başka üye ekle
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Invite Link View */}
                    {inviteMethod === "link" && (
                        <div className="space-y-6">
                            <p className="text-muted-foreground text-sm">
                                Bu linki paylaşarak kişilerin topluluğunuza doğrudan katılmasını sağlayabilirsiniz. WhatsApp grupları için idealdir.
                            </p>

                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Input
                                        readOnly
                                        value={inviteLink}
                                        className="h-12 bg-muted/30 border-border pr-12 font-medium text-sm text-foreground"
                                    />
                                    <div className="absolute right-3 top-3.5 text-muted-foreground">
                                        <LinkIcon className="w-5 h-5 opacity-50" />
                                    </div>
                                </div>
                                <Button
                                    onClick={handleCopyLink}
                                    className="h-12 px-6 bg-gray-900 text-white hover:bg-black rounded-lg gap-2 font-medium shadow-sm active:scale-95 transition-all"
                                >
                                    <Copy className="w-4 h-4" />
                                    Kopyala
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {inviteMethod === "email" && (
                    <div className="px-6 py-5 bg-muted/30 border-t border-border flex items-center justify-end gap-3">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="hover:bg-transparent hover:text-foreground text-muted-foreground font-medium"
                        >
                            İptal
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="gap-2 bg-gray-900 text-white hover:bg-black rounded-full px-8 shadow-sm font-semibold"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Mail className="w-4 h-4" />
                            )}
                            Davetleri Gönder
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

