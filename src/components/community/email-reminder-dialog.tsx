"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, Clock, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EmailReminderDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    eventTitle?: string;
    eventDate?: Date;
    eventLocation?: string;
    onSave: (data: { subject: string; content: string; scheduledAt: Date }) => Promise<void>;
}

export function EmailReminderDialog({
    open,
    onOpenChange,
    eventTitle = "Etkinlik",
    eventDate,
    eventLocation,
    onSave
}: EmailReminderDialogProps) {
    const [subject, setSubject] = useState(`Reminder: {{event.name}} is starting soon`);
    const [content, setContent] = useState(`<b>{{event.name}}</b> is starting soon.

Date:
{{event.date}}

Time:
{{event.time}}`);
    const [date, setDate] = useState<Date | undefined>(
        eventDate ? new Date(eventDate.getTime() - 60 * 60 * 1000) : undefined // 1 hour before
    );
    // Format time from 1h before event
    const formatTime = (d?: Date) => {
        if (!d) return "09:00";
        const h = d.getHours().toString().padStart(2, '0');
        const m = d.getMinutes().toString().padStart(2, '0');
        return `${h}:${m}`;
    };
    const [time, setTime] = useState(formatTime(eventDate ? new Date(eventDate.getTime() - 60 * 60 * 1000) : undefined));
    const [isSaving, setIsSaving] = useState(false);

    // Generate time options
    const timeOptions = Array.from({ length: 48 }, (_, i) => {
        const hour = Math.floor(i / 2);
        const minute = i % 2 === 0 ? "00" : "30";
        return `${hour.toString().padStart(2, "0")}:${minute}`;
    });

    const handleSave = async () => {
        if (!date || !time) return;

        setIsSaving(true);
        try {
            const [hours, minutes] = time.split(':').map(Number);
            const scheduledAt = new Date(date);
            scheduledAt.setHours(hours, minutes);

            await onSave({ subject, content, scheduledAt });
            onOpenChange(false);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] gap-0 p-0 overflow-hidden rounded-2xl">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-xl font-semibold">E-posta Hatırlatması</DialogTitle>
                </DialogHeader>

                <div className="p-6 space-y-6">
                    {/* Subject */}
                    <div className="space-y-2">
                        <Label>Konu</Label>
                        <Input
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="E-posta konusu..."
                        />
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                        <Label>Mesaj İçeriği</Label>
                        <div className="relative">
                            <Textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="min-h-[200px] font-mono text-sm leading-relaxed"
                                placeholder="Mesajınız..."
                            />
                        </div>
                        <p className="text-xs text-gray-500">
                            Değişkenler: {`{{event.name}}`}, {`{{event.date}}`}, {`{{event.time}}`}, {`{{event.location}}`}
                        </p>
                    </div>

                    {/* Schedule (Locked) */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Date</Label>
                            <div className="flex items-center h-10 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed opacity-80">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? format(date, "d MMMM yyyy", { locale: tr }) : "-"}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Time</Label>
                            <div className="flex items-center h-10 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed opacity-80">
                                <Clock className="mr-2 h-4 w-4" />
                                {time}
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-6 pt-2 bg-gray-50/50">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>İptal</Button>
                    <Button onClick={handleSave} disabled={isSaving || !date} className="bg-black text-white hover:bg-gray-800">
                        {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Kaydet
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
