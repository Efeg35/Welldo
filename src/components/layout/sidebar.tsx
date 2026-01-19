"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    Home,
    MessageSquare,
    Megaphone,
    Bookmark,
    MessageCircle,
    Trophy,
    Calendar,
    Video,
    Users,
    ChevronDown,
    Link as LinkIcon,
    Smartphone,
    Globe,
    BookOpen,
    Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateSpaceModal } from "@/components/community/create-space-modal";

interface SidebarProps {
    communityName?: string;
    spaces?: any[];
    links?: any[];
    user?: any;
    userRole?: string;
    enabledFeatures?: Record<string, boolean>;
}

const iconMap: Record<string, any> = {
    'home': Home,
    'message-square': MessageSquare,
    'megaphone': Megaphone,
    'bookmark': Bookmark,
    'message-circle': MessageCircle,
    'trophy': Trophy,
    'calendar': Calendar,
    'video': Video,
    'users': Users,
    'check-circle': BookOpen,
    'hand': Users,
    'smartphone': Smartphone,
    'globe': Globe,
    'link': LinkIcon
};

export function Sidebar({
    communityName = "WellDo Topluluğu",
    spaces = [],
    links = [],
    user,
    userRole = "member",
    enabledFeatures = {
        discussions: true,
        events: true,
        chat: true,
        courses: true,
        gamification: true
    }
}: SidebarProps) {
    const pathname = usePathname();
    const [isCreateSpaceOpen, setIsCreateSpaceOpen] = useState(false);

    // Filter spaces based on enabledFeatures
    const filteredSpaces = spaces.filter(space => {
        // Map space types/categories to features if possible
        // For now, we assume spaces are always 'discussions' or custom
        // If we had a type mapping, we'd check it here.
        // Assuming 'courses' are handled elsewhere or as specific space types.
        if (space.type === 'course' && !enabledFeatures.courses) return false;
        return true;
    });

    // Group spaces by category
    const groupedSpaces = filteredSpaces.reduce((acc, space) => {
        const category = space.category || 'Diğer';
        if (!acc[category]) acc[category] = [];
        acc[category].push(space);
        return acc;
    }, {} as Record<string, typeof spaces>);

    const canCreateSpace = user && (userRole === 'instructor' || userRole === 'admin');

    return (
        <aside className="w-64 border-r border-border bg-[#1a1a2e] flex flex-col h-full text-white">
            {/* Community Header */}
            <div className="p-4 border-b border-white/10">
                <button className="flex items-center gap-2 w-full text-left hover:bg-white/10 rounded-lg p-2 -m-2 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#408FED] to-[#3E1BC9] flex items-center justify-center">
                        <span className="text-white text-sm font-bold">✦</span>
                    </div>
                    <span className="font-semibold text-sm flex-1 truncate text-white">{communityName}</span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-3 space-y-6">
                {/* Fixed Feed Item */}
                <div>
                    <Link
                        href="/dashboard"
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                            pathname === "/dashboard"
                                ? "bg-white/10 text-white font-medium"
                                : "text-gray-400 hover:text-white hover:bg-white/5"
                        )}
                    >
                        <Home className="w-4 h-4" />
                        Akış
                    </Link>
                </div>

                {/* Spaces Header & Create Button */}
                <div className="flex items-center justify-between px-3 mt-6 mb-2">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Alanlar
                    </h3>
                    {canCreateSpace && (
                        <button
                            onClick={() => {
                                console.log("Create Space Clicked");
                                setIsCreateSpaceOpen(true);
                            }}
                            className="text-gray-400 hover:text-white transition-colors relative z-50 cursor-pointer"
                            title="Alan Oluştur"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Dynamic Spaces */}
                <div className="space-y-6">
                    {Object.entries(groupedSpaces).map(([category, categorySpaces]) => (
                        <div key={category}>
                            {category !== 'Spaces' && category !== 'Diğer' && (
                                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-4">
                                    {category}
                                </h3>
                            )}

                            <div className="space-y-1">
                                {(categorySpaces as any[]).map((space: any) => {
                                    const Icon = iconMap[space.icon] || MessageSquare;
                                    const href = `/community/${space.slug}`;
                                    const isActive = pathname === href;
                                    return (
                                        <Link
                                            key={space.id}
                                            href={href}
                                            className={cn(
                                                "flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm transition-colors",
                                                isActive
                                                    ? "bg-white/10 text-white font-medium"
                                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                                            )}
                                        >
                                            <Icon className="w-4 h-4 shrink-0" />
                                            <span className="truncate">{space.name}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Links Section */}
                {links.length > 0 && (
                    <div>
                        <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-6">
                            Bağlantılar
                        </h3>
                        <div className="space-y-1">
                            {links.map((link) => {
                                const Icon = iconMap[link.icon] || LinkIcon;
                                return (
                                    <a
                                        key={link.id}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                                    >
                                        <Icon className="w-4 h-4" />
                                        {link.label}
                                    </a>
                                );
                            })}
                        </div>
                    </div>
                )}
            </nav>

            {/* Go Live Button */}
            {enabledFeatures.events && (
                <div className="p-4 border-t border-border">
                    <Button variant="outline" className="w-full gap-2">
                        <Video className="w-4 h-4" />
                        Canlı Yayın Başlat
                    </Button>
                </div>
            )}

            <CreateSpaceModal
                isOpen={isCreateSpaceOpen}
                onClose={() => setIsCreateSpaceOpen(false)}
                communityId={spaces?.[0]?.community_id || ""} // Best effort fallback
            />
        </aside>
    );
}
