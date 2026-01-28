"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    Search,
    CheckCircle2,
    Circle,
    ArrowLeft,
    Loader2,
    X,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { checkInAttendee } from "@/actions/events";
import { toast } from "sonner";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface Attendee {
    user_id: string;
    status: string;
    checked_in_at: string | null;
    created_at: string;
    user: {
        id: string;
        full_name: string;
        avatar_url: string | null;
        email: string | null;
    };
}

interface EventAttendeesPanelProps {
    eventId: string;
    eventTitle: string;
    attendees: Attendee[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onRefresh: () => void;
}

export function EventAttendeesPanel({
    eventId,
    eventTitle,
    attendees,
    open,
    onOpenChange,
    onRefresh,
}: EventAttendeesPanelProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [checkingIn, setCheckingIn] = useState<string | null>(null);

    const filteredAttendees = attendees.filter((a) =>
        a.user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const checkedInCount = attendees.filter((a) => a.checked_in_at).length;

    const handleCheckIn = async (attendeeUserId: string) => {
        setCheckingIn(attendeeUserId);
        try {
            await checkInAttendee(eventId, attendeeUserId);
            toast.success("Giriş kaydedildi");
            onRefresh();
        } catch (error: any) {
            toast.error(error.message || "Giriş kaydedilemedi");
        } finally {
            setCheckingIn(null);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
                {/* Header */}
                <div className="flex items-center gap-3 p-4 border-b border-gray-100">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onOpenChange(false)}
                        className="h-8 w-8"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex-1">
                        <SheetTitle className="text-lg font-bold text-gray-900">
                            Katılımcılar
                        </SheetTitle>
                        <p className="text-sm text-gray-500 truncate">{eventTitle}</p>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-bold text-gray-900">{checkedInCount}</span>
                        <span className="text-gray-500">/{attendees.length}</span>
                        <p className="text-xs text-gray-500">Giriş Yaptı</p>
                    </div>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-gray-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Katılımcı ara..."
                            className="pl-9 h-10 bg-gray-50 border-gray-200"
                        />
                    </div>
                </div>

                {/* Attendees List */}
                <div className="flex-1 overflow-y-auto">
                    {filteredAttendees.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <Circle className="w-12 h-12 text-gray-300 mb-3" />
                            <p className="text-gray-500">Katılımcı bulunamadı</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {filteredAttendees.map((attendee) => (
                                <div
                                    key={attendee.user_id}
                                    className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors"
                                >
                                    <Avatar className="w-10 h-10 border border-gray-200">
                                        <AvatarImage src={attendee.user.avatar_url || undefined} />
                                        <AvatarFallback className="bg-gray-100 text-gray-700 text-sm font-medium">
                                            {getInitials(attendee.user.full_name)}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 truncate">
                                            {attendee.user.full_name}
                                        </p>
                                        {attendee.user.email && (
                                            <p className="text-sm text-gray-500 truncate">
                                                {attendee.user.email}
                                            </p>
                                        )}
                                    </div>

                                    {attendee.checked_in_at ? (
                                        <div className="flex items-center gap-2 text-green-600">
                                            <CheckCircle2 className="w-5 h-5 fill-green-600 text-white" />
                                            <div className="text-right">
                                                <span className="text-sm font-medium">Geldi</span>
                                                <p className="text-xs text-gray-500">
                                                    {format(new Date(attendee.checked_in_at), "HH:mm", { locale: tr })}
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleCheckIn(attendee.user_id)}
                                            disabled={checkingIn === attendee.user_id}
                                            className="h-9 px-4 rounded-lg border-gray-200 text-sm font-medium"
                                        >
                                            {checkingIn === attendee.user_id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                "Giriş Yap"
                                            )}
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
