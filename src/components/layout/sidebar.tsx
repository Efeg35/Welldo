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
    Plus,
    Settings,
    CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateSpaceModal } from "@/components/community/create-space-modal";
import { CreateCourseModal } from "@/components/courses/create-course-modal";
import { SidebarLinksSection } from "@/components/layout/sidebar-links-section";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateSpaceGroupModal } from "@/components/community/create-space-group-modal";
import { FolderPlus } from "lucide-react";

interface SidebarProps {
    communityName?: string;
    spaces?: any[];
    groups?: any[]; // New prop
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
    'book-open': BookOpen,
};

const typeIconMap: Record<string, any> = {
    'post': MessageSquare,
    'event': Calendar,
    'chat': MessageCircle,
    'course': BookOpen,
};

export function Sidebar({
    communityName = "WellDo Topluluğu",
    spaces = [],
    groups = [], // Default empty
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
    const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(false);
    const [isCreateSpaceGroupOpen, setIsCreateSpaceGroupOpen] = useState(false);
    const [initialGroupId, setInitialGroupId] = useState<string | undefined>(undefined);

    const handleCreateSpace = (groupId: string) => {
        setInitialGroupId(groupId === 'ungrouped' ? 'none' : groupId);
        setIsCreateSpaceOpen(true);
    };

    // Filter spaces based on enabledFeatures
    const filteredSpaces = spaces.filter(space => {
        if (space.type === 'course' && enabledFeatures.courses === false) return false;
        return true;
    });

    // Group spaces
    const groupsMap: Record<string, { id: string, title: string, position: number, spaces: any[] }> = {};

    // 1. Initialize from groups prop
    groups.forEach(g => {
        groupsMap[g.id] = {
            id: g.id,
            title: g.name,
            position: g.position,
            spaces: []
        };
    });

    // 2. Initialize 'ungrouped' bucket
    // We treat 'ungrouped' (Alanlar) as a bucket for spaces without a group.
    // Ensure it exists? Or only if there are ungrouped spaces?
    // Let's always have it primarily for logic, but maybe valid to show even if empty? 
    // Usually 'Alanlar' header is always shown if we stick to the old design, but now with groups, 
    // maybe we only show it if there are spaces.
    // Let's create it.
    if (!groupsMap['ungrouped']) {
        groupsMap['ungrouped'] = {
            id: 'ungrouped',
            title: 'Alanlar',
            position: 9999, // Force to end or beginning? User didn't specify. Let's put at end for now.
            spaces: []
        };
    }

    // 3. Distribute spaces
    filteredSpaces.forEach(space => {
        const groupId = space.group?.id || space.group_id;
        const targetId = (groupId && groupsMap[groupId]) ? groupId : 'ungrouped';
        groupsMap[targetId].spaces.push(space);
    });

    // 4. Sort
    const sortedGroups = Object.values(groupsMap).sort((a, b) => a.position - b.position);

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
                {/* Dynamic Spaces */}
                <div className="space-y-6 mt-6">
                    {sortedGroups.map((group) => (
                        <div key={group.id}>
                            <div className="flex items-center justify-between px-3 mb-2 min-h-[20px] group/header">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    {group.title}
                                </h3>
                                {/* Show Create Actions next to the group header */}
                                {canCreateSpace && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button
                                                className="text-gray-400 hover:text-white transition-colors outline-none opacity-0 group-hover/header:opacity-100 focus:opacity-100"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48">
                                            <DropdownMenuItem onClick={() => handleCreateSpace(group.id)}>
                                                <Plus className="w-4 h-4 mr-2" />
                                                Alan oluştur
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setIsCreateSpaceGroupOpen(true)}>
                                                <FolderPlus className="w-4 h-4 mr-2" />
                                                Alan Grubu oluştur
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>

                            <div className="space-y-1">
                                {group.spaces.map((space: any) => {
                                    const Icon = iconMap[space.icon] || typeIconMap[space.type] || MessageSquare;
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
                                            <span className="truncate flex-1">{space.name}</span>
                                            {space.unread_count > 0 && (
                                                <span className="bg-muted-foreground/20 text-muted-foreground text-[10px] font-medium px-1.5 py-0.5 rounded-md min-w-[20px] text-center">
                                                    {space.unread_count > 99 ? '99+' : space.unread_count}
                                                </span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Links Section - Realtime */}
                <SidebarLinksSection
                    communityId={spaces?.[0]?.community_id || ""}
                    canEdit={canCreateSpace || false}
                />
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
                onSwitchToCourse={() => {
                    setIsCreateSpaceOpen(false);
                    setIsCreateCourseOpen(true);
                }}
                groups={sortedGroups
                    .filter(g => g.id !== 'ungrouped')
                    .map(g => ({ id: g.id, name: g.title }))}
                initialGroupId={initialGroupId}
            />
            <CreateSpaceGroupModal
                isOpen={isCreateSpaceGroupOpen}
                onClose={() => setIsCreateSpaceGroupOpen(false)}
                communityId={spaces?.[0]?.community_id || ""}
            />
            <CreateCourseModal
                isOpen={isCreateCourseOpen}
                onClose={() => setIsCreateCourseOpen(false)}
                communityId={spaces?.[0]?.community_id || ""}
                groups={sortedGroups
                    .filter(g => g.id !== 'ungrouped')
                    .map(g => ({ id: g.id, name: g.title }))}
                initialGroupId={initialGroupId}
            />
        </aside>
    );
}
