"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { createCourse } from "@/actions/courses";
import { Lock, Globe, EyeOff, LayoutTemplate } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateCourseModalProps {
    communityId: string;
    children: React.ReactNode;
}

export function CreateCourseModal({ communityId, children }: CreateCourseModalProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [name, setName] = useState("");
    const [access, setAccess] = useState<"open" | "private" | "secret">("open");

    const handleCreate = () => {
        if (!name.trim()) return;

        startTransition(async () => {
            try {
                await createCourse(communityId, name, null, access !== 'open');
                toast.success("Kurs alanı oluşturuldu");
                setOpen(false);
                setName("");
                setAccess("open");
            } catch (error) {
                toast.error("Kurs oluşturulurken bir hata oluştu");
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] gap-0 p-0 overflow-hidden">
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <LayoutTemplate className="w-5 h-5" />
                        Kurs alanı oluştur
                    </DialogTitle>
                </DialogHeader>

                <div className="p-6 space-y-6">
                    {/* Space Name */}
                    <div className="space-y-3">
                        <Label className="text-base font-semibold">Alan adı</Label>
                        <div className="flex gap-3 items-center">
                            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                                <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                            </div>
                            <Input
                                placeholder="Alan adı"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="h-10"
                            />
                        </div>
                    </div>

                    {/* Space Group - visual only for now */}
                    <div className="space-y-3">
                        <Label className="text-base font-semibold">Alan grubu</Label>
                        <Select defaultValue="default">
                            <SelectTrigger>
                                <SelectValue placeholder="Bir grup seç" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="default">Alanlar</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Access */}
                    <div className="space-y-3">
                        <Label className="text-base font-semibold">Erişim</Label>
                        <RadioGroup value={access} onValueChange={(val: any) => setAccess(val)} className="grid grid-cols-3 gap-3">
                            <Label
                                htmlFor="access-open"
                                className={cn(
                                    "flex flex-col items-center justify-center gap-2 border-2 rounded-xl p-4 cursor-pointer hover:border-blue-500/50 hover:bg-blue-50 transition-all",
                                    access === "open" ? "border-blue-500 bg-blue-50" : "border-border"
                                )}
                            >
                                <RadioGroupItem value="open" id="access-open" className="sr-only" />
                                <span className="font-semibold">Açık</span>
                            </Label>
                            <Label
                                htmlFor="access-private"
                                className={cn(
                                    "flex flex-col items-center justify-center gap-2 border-2 rounded-xl p-4 cursor-pointer hover:border-blue-500/50 hover:bg-blue-50 transition-all",
                                    access === "private" ? "border-blue-500 bg-blue-50" : "border-border"
                                )}
                            >
                                <RadioGroupItem value="private" id="access-private" className="sr-only" />
                                <span className="font-semibold">Özel</span>
                            </Label>
                            <Label
                                htmlFor="access-secret"
                                className={cn(
                                    "flex flex-col items-center justify-center gap-2 border-2 rounded-xl p-4 cursor-pointer hover:border-blue-500/50 hover:bg-blue-50 transition-all",
                                    access === "secret" ? "border-blue-500 bg-blue-50" : "border-border"
                                )}
                            >
                                <RadioGroupItem value="secret" id="access-secret" className="sr-only" />
                                <span className="font-semibold">Gizli</span>
                            </Label>
                        </RadioGroup>
                        <p className="text-xs text-muted-foreground text-center">
                            {access === 'open' && "Topluluğunuzdaki herkes bu alanı görebilir ve katılabilir."}
                            {access === 'private' && "Herkes görebilir ancak katılmak için onay gerekir."}
                            {access === 'secret' && "Sadece davet edilen üyeler bu alanı görebilir."}
                        </p>
                    </div>

                    {/* Notifications - Visual Only */}
                    <div className="space-y-3 pt-2">
                        <Label className="text-base font-semibold">Yeni gönderi bildirimleri</Label>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="mt-1">
                                    <input type="checkbox" id="notify-email" className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                                </div>
                                <div>
                                    <label htmlFor="notify-email" className="text-sm font-medium text-gray-900 block">E-posta</label>
                                    <p className="text-xs text-muted-foreground">Yeni gönderiler paylaşıldığında üyeler e-posta alacak.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="mt-1">
                                    <input type="checkbox" id="notify-push" className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                                </div>
                                <div>
                                    <label htmlFor="notify-push" className="text-sm font-medium text-gray-900 block">Uygulama İçi</label>
                                    <p className="text-xs text-muted-foreground">Yeni gönderiler paylaşıldığında üyeler uygulama içi bildirim görecek.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                <DialogFooter className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between w-full">
                    <DialogClose asChild>
                        <Button variant="outline" className="w-full sm:w-auto bg-white">Geri</Button>
                    </DialogClose>
                    <Button onClick={handleCreate} disabled={!name.trim() || isPending} className="w-full sm:w-auto bg-slate-500 hover:bg-slate-600 text-white min-w-[120px]">
                        {isPending ? "Oluşturuluyor..." : "Alan oluştur"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
