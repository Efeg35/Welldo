"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, List, Calendar, ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { createCourse } from "@/actions/courses";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface CreateCourseModalProps {
    isOpen: boolean;
    onClose: () => void;
    communityId: string; // Required to link course to community
    communitySlug?: string; // Not required for path anymore
}

type CourseType = 'self-paced' | 'structured' | 'scheduled';
type Step = 'type-selection' | 'details';

const COURSE_TYPES = [
    {
        id: 'self-paced',
        title: 'Kendi Hızında',
        description: 'Kurs, üye kaydolduğunda başlar. Tüm içerik hemen erişilebilir olur.',
        icon: CheckCircle2
    },
    {
        id: 'structured',
        title: 'Yapılandırılmış',
        description: 'Kurs, üye kaydolduğunda başlar. Bölümler kayıt tarihine göre kademeli olarak açılır.',
        icon: List
    },
    {
        id: 'scheduled',
        title: 'Zamanlanmış',
        description: 'Kurs belirli bir tarihte başlar. Bölümler o tarihe göre kademeli olarak açılır.',
        icon: Calendar
    }
] as const;

export function CreateCourseModal({ isOpen, onClose, communityId, communitySlug }: CreateCourseModalProps) {
    const [step, setStep] = useState<Step>('type-selection');
    const [selectedType, setSelectedType] = useState<CourseType | null>(null);
    const [name, setName] = useState("");
    const [category, setCategory] = useState("Spaces");
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleCreate = () => {
        if (!selectedType || !name) return;

        startTransition(async () => {
            try {
                // communityId, name, description, isPrivate, courseType, category
                const { channel } = await createCourse(communityId, name, null, true, selectedType, category);

                toast.success("Kurs başarıyla oluşturuldu!");
                onClose();
                // Redirect to the new course dashboard
                // path: /community/[channelSlug]
                router.push(`/community/${channel.slug}?view=builder`);

                // Reset state
                setStep('type-selection');
                setName("");
                setSelectedType(null);

            } catch (error) {
                console.error(error);
                toast.error("Kurs oluşturulamadı");
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>
                        {step === 'type-selection' ? 'Kurs türünü seçin' : 'Kurs alanı oluştur'}
                    </DialogTitle>
                    {step === 'type-selection' && (
                        <DialogDescription>
                            Öğrencilerinizin içeriğe nasıl erişeceğini belirleyin.
                        </DialogDescription>
                    )}
                </DialogHeader>

                <div className="py-4">
                    {step === 'type-selection' ? (
                        <div className="space-y-3">
                            {COURSE_TYPES.map((type) => {
                                const Icon = type.icon;
                                const isSelected = selectedType === type.id;
                                return (
                                    <div
                                        key={type.id}
                                        onClick={() => setSelectedType(type.id)}
                                        className={cn(
                                            "flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all hover:border-primary/50",
                                            isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card"
                                        )}
                                    >
                                        <div className={cn("mt-1 p-1 rounded-full", isSelected ? "text-primary" : "text-muted-foreground")}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-semibold text-sm">{type.title}</h4>
                                                {isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />}
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                                                {type.description}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-base font-semibold">Alan adı</Label>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-blue-600">
                                        <div className="w-2.5 h-2.5 bg-current rounded-full"></div>
                                    </div>
                                    <Input
                                        placeholder="Alan adı"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="h-10"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-base font-semibold">Alan grubu</Label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Bir grup seç" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Spaces">Alanlar</SelectItem>
                                        <SelectItem value="Community">Topluluk</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-base font-semibold">Kurs erişimi</Label>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Alan <strong>taslak modunda</strong> oluşturulacak ve üyelerinize görünmeyecek.
                                    Alanı oluşturduktan sonra erişim ayarlarını güncelleyebilirsiniz.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex justify-between sm:justify-between items-center w-full">
                    {step === 'details' ? (
                        <Button variant="ghost" onClick={() => setStep('type-selection')} disabled={isPending}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Geri
                        </Button>
                    ) : <div></div>}

                    <Button
                        onClick={step === 'type-selection' ? () => setStep('details') : handleCreate}
                        disabled={
                            (step === 'type-selection' && !selectedType) ||
                            (step === 'details' && !name) ||
                            isPending
                        }
                        className="min-w-[100px]"
                    >
                        {isPending ? "Oluşturuluyor..." : (
                            step === 'type-selection' ? (
                                <>
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </>
                            ) : "Alan oluştur"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
