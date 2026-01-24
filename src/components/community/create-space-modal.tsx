"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useTransition } from "react";
import { createChannel } from "@/actions/community";
import {
    MessageSquare,
    MessageCircle,
    Calendar,
    BookOpen,
    Users,
    Image as ImageIcon,
    Check,
    Lock,
    EyeOff,
    Globe,
    ArrowLeft,
    ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface CreateSpaceModalProps {
    isOpen: boolean;
    onClose: () => void;
    communityId: string;
    onSwitchToCourse?: () => void;
}

type Step = 'type-selection' | 'details' | 'course-type';
type SpaceType = 'post' | 'chat' | 'event' | 'course';

const SPACE_TYPES: { type: SpaceType; label: string; icon: any; description: string }[] = [
    { type: 'post', label: 'Gönderiler', icon: MessageSquare, description: 'Tartışmalar ve içerik paylaşımı için esnek bir alan.' },
    { type: 'event', label: 'Etkinlikler', icon: Calendar, description: 'Yaklaşan etkinlikleri düzenleyin ve yönetin.' },
    { type: 'chat', label: 'Sohbet', icon: MessageCircle, description: 'Topluluk üyeleriniz için gerçek zamanlı mesajlaşma.' },
    { type: 'course', label: 'Kurs', icon: BookOpen, description: 'Yapılandırılmış içerik ve dersler sunun.' },
];

export function CreateSpaceModal({ isOpen, onClose, communityId, onSwitchToCourse }: CreateSpaceModalProps) {
    const [step, setStep] = useState<Step>('type-selection');
    const [selectedType, setSelectedType] = useState<SpaceType>('post');
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [category, setCategory] = useState("Spaces"); // Default category
    const [access, setAccess] = useState("open");
    const [notifications, setNotifications] = useState({ email: true, inApp: true });

    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleTypeSelect = (type: SpaceType) => {
        setSelectedType(type);
        if (type === 'course') {
            if (onClose) onClose();
            if (onSwitchToCourse) onSwitchToCourse();
        } else {
            setStep('details');
        }
    };

    const handleCreate = () => {
        if (!name) return;

        // Auto-generate slug if empty (simple version)
        const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

        const iconMap: Record<string, string> = {
            post: 'message-square',
            event: 'calendar',
            chat: 'message-circle',
            course: 'book-open'
        };

        startTransition(async () => {
            try {
                await createChannel({
                    communityId,
                    name,
                    slug: finalSlug,
                    type: selectedType,
                    access_level: access,
                    category,
                    settings: { notifications },
                    icon: iconMap[selectedType] || 'message-square'
                });
                onClose();
                router.refresh();
                // Reset form
                setStep('type-selection');
                setName("");
                setSlug("");
                setSlug("");
                toast.success("Alan başarıyla oluşturuldu", {
                    description: `${name} oluşturuldu.`,
                });
            } catch (error) {
                console.error("Failed to create space", error);
                toast.error("Alan oluşturulamadı", {
                    description: "Veritabanı şeması güncel mi kontrol edin.",
                });
            }
        });
    };

    const selectedTypeLabel = SPACE_TYPES.find(t => t.type === selectedType)?.label || selectedType;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-background text-foreground border-border">

                {step === 'type-selection' && (
                    <div className="p-6">
                        <DialogHeader>
                            <DialogTitle className="text-xl">Alan türünü seçin</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4 mt-6">
                            {SPACE_TYPES.map((item) => (
                                <button
                                    key={item.type}
                                    onClick={() => handleTypeSelect(item.type)}
                                    className="flex flex-col items-start p-4 border rounded-xl hover:border-primary hover:bg-muted/50 transition-all text-left group"
                                >
                                    <div className="p-2 rounded-lg bg-muted group-hover:bg-background mb-3">
                                        <item.icon className="w-6 h-6 text-foreground" />
                                    </div>
                                    <span className="font-semibold">{item.label}</span>
                                    {/* <p className="text-xs text-muted-foreground mt-1">{item.description}</p> */}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step === 'details' && (
                    <div className="p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => setStep('type-selection')}
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </Button>
                            <DialogHeader>
                                <DialogTitle className="text-xl">{selectedTypeLabel} alanı oluştur</DialogTitle>
                            </DialogHeader>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label>Alan adı</Label>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                                        {/* Dynamic icon based on selection */}
                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                    </div>
                                    <Input
                                        placeholder="Alan adı"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="h-10"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Alan grubu</Label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Spaces">Alanlar</SelectItem>
                                        <SelectItem value="Community">Topluluk</SelectItem>
                                        <SelectItem value="Support">Destek</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Erişim</Label>
                                <div className="grid grid-cols-3 gap-3">
                                    <button
                                        onClick={() => setAccess('open')}
                                        className={cn("flex flex-col items-center justify-center p-3 border rounded-lg hover:bg-muted/50 transition-all", access === 'open' && "border-primary bg-muted/30")}
                                    >
                                        <span className="font-medium text-sm">Açık</span>
                                    </button>
                                    <button
                                        onClick={() => setAccess('private')}
                                        className={cn("flex flex-col items-center justify-center p-3 border rounded-lg hover:bg-muted/50 transition-all", access === 'private' && "border-primary bg-muted/30")}
                                    >
                                        <span className="font-medium text-sm">Özel</span>
                                    </button>
                                    <button
                                        onClick={() => setAccess('secret')}
                                        className={cn("flex flex-col items-center justify-center p-3 border rounded-lg hover:bg-muted/50 transition-all", access === 'secret' && "border-primary bg-muted/30")}
                                    >
                                        <span className="font-medium text-sm">Gizli</span>
                                    </button>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {access === 'open' && "Topluluğunuzdaki herkes bu alanı görebilir ve katılabilir."}
                                    {access === 'private' && "Sadece davet edilen üyeler bu alanı görebilir ve katılabilir."}
                                    {access === 'secret' && "Üye olmayanlardan gizlenir. Sadece davet edilen üyeler katılabilir."}
                                </p>
                            </div>

                            <div className="space-y-3">
                                <Label>Yeni gönderi bildirimleri</Label>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setNotifications({ ...notifications, email: !notifications.email })}
                                        className={cn("w-5 h-5 rounded border flex items-center justify-center transition-colors", notifications.email ? "bg-primary border-primary text-primary-foreground" : "border-input")}
                                    >
                                        {notifications.email && <Check className="w-3 h-3" />}
                                    </button>
                                    <span className="text-sm">E-posta <span className="text-muted-foreground text-xs block">Yeni gönderiler paylaşıldığında üyeler e-posta alacak.</span></span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setNotifications({ ...notifications, inApp: !notifications.inApp })}
                                        className={cn("w-5 h-5 rounded border flex items-center justify-center transition-colors", notifications.inApp ? "bg-primary border-primary text-primary-foreground" : "border-input")}
                                    >
                                        {notifications.inApp && <Check className="w-3 h-3" />}
                                    </button>
                                    <span className="text-sm">Uygulama İçi <span className="text-muted-foreground text-xs block">Yeni gönderiler paylaşıldığında üyeler uygulama içi bildirim görecek.</span></span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setStep('type-selection')}>
                                Geri
                            </Button>
                            <Button className="flex-[2] bg-[#1F2937] hover:bg-[#111827] text-white" onClick={handleCreate} disabled={!name || isPending}>
                                {isPending ? 'Oluşturuluyor...' : 'Alan oluştur'}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
