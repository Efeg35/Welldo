"use client";

import { useEffect, useState } from "react";
import { Bell, Check, Archive, Settings, MoreHorizontal } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import {
    getNotifications,
    markNotificationAsRead,
    markAllAsRead,
    archiveNotification,
    getUnreadCount
} from "@/actions/notifications";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export function NotificationsPopover() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [activeTab, setActiveTab] = useState("inbox");
    const supabase = createClient();

    const fetchNotifications = async () => {
        const data = await getNotifications(activeTab as any);
        setNotifications(data);
        const count = await getUnreadCount();
        setUnreadCount(count);
    };

    useEffect(() => {
        fetchNotifications();
    }, [activeTab]);

    useEffect(() => {
        const setupRealtime = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const channel = supabase
                .channel(`user-notifications-${user.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${user.id}`
                    },
                    () => {
                        fetchNotifications();
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        };

        setupRealtime();
    }, [supabase]);

    const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        await markNotificationAsRead(id);
    };

    const handleArchive = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        await archiveNotification(id);
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead();
            await fetchNotifications();
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative rounded-full">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] text-white font-bold border-2 border-white">
                            {unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold">Bildirimler</h2>
                    <div className="flex items-center gap-1">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={handleMarkAllAsRead}
                                >
                                    <Check className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                                <p>Okundu olarak işaretle</p>
                            </TooltipContent>
                        </Tooltip>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Settings className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="px-4 pt-2 border-b">
                        <TabsList className="bg-transparent h-auto p-0 gap-4">
                            <TabsTrigger
                                value="inbox"
                                className="px-0 py-2 bg-transparent border-b-2 border-transparent data-[state=active]:border-primary rounded-none shadow-none"
                            >
                                Gelen Kutusu
                            </TabsTrigger>
                            <TabsTrigger
                                value="all"
                                className="px-0 py-2 bg-transparent border-b-2 border-transparent data-[state=active]:border-primary rounded-none shadow-none"
                            >
                                Tümü
                            </TabsTrigger>
                            <TabsTrigger
                                value="archived"
                                className="px-0 py-2 bg-transparent border-b-2 border-transparent data-[state=active]:border-primary rounded-none shadow-none"
                            >
                                Arşivlendi
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        <TabsContent value={activeTab} className="m-0">
                            {notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <Bell className="h-12 w-12 text-muted-foreground/30 mb-4" />
                                    <p className="font-medium text-muted-foreground">Bildirim bulunamadı</p>
                                    <p className="text-sm text-muted-foreground/60">Bildirimleriniz burada görünecek.</p>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={cn(
                                                "p-4 flex gap-3 group hover:bg-muted/50 transition-colors relative",
                                                !notification.is_read && "bg-blue-50/50"
                                            )}
                                        >
                                            <Avatar className="h-10 w-10 shrink-0">
                                                <AvatarImage src={notification.actor?.avatar_url} />
                                                <AvatarFallback>U</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 space-y-1">
                                                <p className="text-sm leading-tight">
                                                    <span className="font-semibold">{notification.actor?.full_name}</span>
                                                    {" "}
                                                    {notification.type === 'like' && "gönderinizi beğendi."}
                                                    {notification.type === 'comment' && "gönderinize yorum yaptı."}
                                                    {notification.type === 'mention' && "sizden bahsetti."}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: tr })}
                                                </p>
                                            </div>
                                            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {!notification.is_read && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={(e) => handleMarkAsRead(notification.id, e)}
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                {!notification.is_archived && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={(e) => handleArchive(notification.id, e)}
                                                    >
                                                        <Archive className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </div>
                </Tabs>

                <div className="p-4 border-t text-center">
                    <Button variant="link" size="sm" className="text-xs">
                        Tümünü Görüntüle
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
