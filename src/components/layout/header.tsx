"use client";

import Link from "next/link";
import { Search, Bell, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserNav } from "@/components/layout/user-nav";

const navigation = [
    { href: "/dashboard", label: "Ana Sayfa" },
    { href: "/chat", label: "Sohbet" },
    { href: "/crm", label: "Üye Yönetimi" },
    { href: "/events", label: "Etkinlikler" },
    { href: "/live", label: "Canlı Yayın" },
    { href: "/courses", label: "Kurslar" },
    { href: "/email", label: "E-posta" },
];

export function Header() {
    const pathname = usePathname();

    return (
        <header className="sticky top-0 z-40 border-b border-border bg-white backdrop-blur-lg">
            <div className="flex h-16 items-center justify-between px-6">
                {/* Left: Logo */}
                <div className="flex items-center gap-8">
                    <Link href="/" className="flex items-center gap-2">
                        <div
                            className="flex h-8 w-8 items-center justify-center rounded-lg"
                            style={{ background: 'linear-gradient(135deg, #408FED 0%, #3E1BC9 100%)' }}
                        >
                            <span className="text-sm font-bold text-white">W</span>
                        </div>
                        <span className="text-lg font-bold tracking-tight">WellDo</span>
                    </Link>

                </div>

                {/* Navigation Links - Desktop (Centered) */}
                <nav className="hidden md:flex items-center gap-1 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    {navigation.map((item) => {
                        const isActive = pathname?.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "px-3 py-2 text-sm font-medium rounded-full transition-colors",
                                    isActive
                                        ? "bg-black text-white"
                                        : "text-muted-foreground hover:text-foreground hover:bg-gray-100"
                                )}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2 text-muted-foreground hidden lg:flex rounded-full">
                        <Search className="w-4 h-4" />
                        <span className="hidden lg:inline">Ara</span>
                    </Button>

                    <Button variant="ghost" size="icon" className="relative rounded-full">
                        <Bell className="h-5 w-5" />
                        <span className="absolute 1.5 1.5 flex h-2 w-2 rounded-full bg-red-600 top-2 right-2"></span>
                    </Button>

                    <Button variant="ghost" size="icon" className="rounded-full">
                        <MessageCircle className="w-5 h-5" />
                    </Button>

                    <UserNav />
                </div>
            </div>
        </header>
    );
}
