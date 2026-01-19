"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
    Settings,
    LogOut,
    ChevronRight,
    Trophy,
    Calendar,
    CreditCard,
    Bell,
    HelpCircle,
    Loader2,
} from "lucide-react";
import Link from "next/link";
import type { Profile } from "@/types";

const menuItems = [
    {
        icon: Trophy,
        label: "Başarılarım",
        href: "/profile/achievements",
        badge: "3 yeni",
    },
    { icon: Calendar, label: "Etkinliklerim", href: "/profile/events" },
    { icon: CreditCard, label: "Üyeliklerim", href: "/profile/subscriptions" },
    { icon: Bell, label: "Bildirimler", href: "/profile/notifications" },
    { icon: Settings, label: "Ayarlar", href: "/profile/settings" },
    { icon: HelpCircle, label: "Yardım", href: "/help" },
];

export default function ProfilePage() {
    const { user, signOut, loading: authLoading } = useAuth();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push("/login");
            return;
        }

        const fetchProfile = async () => {
            const { data } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();
            setProfile(data);
            setLoading(false);
        };

        fetchProfile();
    }, [user, authLoading, router, supabase]);

    if (loading || authLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 px-4 py-6 pb-24">
            {/* Profile Header */}
            <div className="flex flex-col items-center gap-4 text-center">
                <Avatar className="h-24 w-24 border-4 border-violet-500/20">
                    <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || ""} />
                    <AvatarFallback className="text-xl">
                        {profile?.full_name?.[0] || user?.email?.[0] || "?"}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <h1 className="text-xl font-bold">{profile?.full_name || "Kullanıcı"}</h1>
                    <p className="text-sm text-muted-foreground">{profile?.email || user?.email}</p>
                </div>

                {/* Mock Stats - In real app, fetch from gamification table */}
                <div className="flex items-center gap-4">
                    <Badge className="gap-1 bg-gradient-to-r from-violet-500 to-purple-500">
                        <Trophy className="h-3 w-3" />
                        Seviye 1
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                        0 Puan
                    </Badge>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 p-4">
                    <div className="text-2xl font-bold">0</div>
                    <div className="text-sm text-muted-foreground">Tamamlanan Ders</div>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-4">
                    <div className="text-2xl font-bold">0</div>
                    <div className="text-sm text-muted-foreground">Aktif Üyelik</div>
                </div>
            </div>

            <Separator />

            {/* Menu Items */}
            <div className="flex flex-col gap-1">
                {menuItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-muted"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                            <item.icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <span className="flex-1 font-medium">{item.label}</span>
                        {item.badge && (
                            <Badge variant="secondary" className="text-xs">
                                {item.badge}
                            </Badge>
                        )}
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                ))}
            </div>

            <Separator />

            {/* Logout Button */}
            <Button
                variant="ghost"
                className="gap-2 text-destructive hover:text-destructive"
                onClick={() => signOut()}
            >
                <LogOut className="h-4 w-4" />
                Çıkış Yap
            </Button>

            {/* Footer */}
            <div className="text-center text-xs text-muted-foreground">
                <p>Üyelik: {new Date(profile?.created_at || Date.now()).toLocaleDateString("tr-TR")}</p>
                <p className="mt-1">WellDo v1.0.0</p>
            </div>
        </div>
    );
}
