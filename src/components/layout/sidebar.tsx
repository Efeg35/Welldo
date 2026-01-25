"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
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
    Smartphone,
    Globe,
    BookOpen,
    Plus,
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

// DnD Kit Imports
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
    DropAnimation,
    UniqueIdentifier
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { reorderGroups, reorderChannels } from "@/actions/reorder";
import { Channel, ChannelGroup, Profile } from "@/types/database";

// Extended Types for UI
interface SidebarChannel extends Channel {
    unread_count?: number;
}

interface RenderGroup {
    id: string;
    title: string;
    position: number;
    spaces: SidebarChannel[];
}

interface SidebarProps {
    communityName?: string;
    spaces?: any[];
    groups?: any[];
    links?: any[];
    user?: Profile | null;
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

// --- Sortable Components ---

function SortableSpaceItem({ space, isActivePath }: { space: SidebarChannel, isActivePath: boolean }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: space.id,
        data: {
            dndType: 'SPACE',
            space,
            parentId: space.group_id || 'ungrouped'
        }
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    };

    const Icon = (space.icon && iconMap[space.icon]) || typeIconMap[space.type] || MessageSquare;

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none">
            <Link
                href={`/community/${space.slug}`}
                className={cn(
                    "flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm transition-colors group relative",
                    isActivePath
                        ? "bg-white/10 text-white font-medium"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
            >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate flex-1">{space.name}</span>
                {space.unread_count !== undefined && space.unread_count > 0 && (
                    <span className="bg-muted-foreground/20 text-muted-foreground text-[10px] font-medium px-1.5 py-0.5 rounded-md min-w-[20px] text-center">
                        {space.unread_count > 99 ? '99+' : space.unread_count}
                    </span>
                )}
            </Link>
        </div>
    );
}

function SortableGroupItem({
    group,
    spaces,
    canCreateSpace,
    handleCreateSpace,
    handleCreateSpaceGroup,
}: {
    group: RenderGroup,
    spaces: SidebarChannel[],
    canCreateSpace: boolean,
    handleCreateSpace: (id: string) => void,
    handleCreateSpaceGroup: () => void
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: group.id,
        data: {
            dndType: 'GROUP',
            group
        },
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="touch-none mb-6">
            <div
                className="flex items-center justify-between px-3 mb-2 min-h-[20px] group/header cursor-grab active:cursor-grabbing"
                {...attributes}
                {...listeners}
            >
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider select-none">
                    {group.title}
                </h3>
                {canCreateSpace && (
                    <div onPointerDown={(e) => e.stopPropagation()}>
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
                                <DropdownMenuItem onClick={handleCreateSpaceGroup}>
                                    <FolderPlus className="w-4 h-4 mr-2" />
                                    Alan Grubu oluştur
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
            </div>

            <div className="space-y-1 min-h-[10px]">
                <SortableContext
                    items={spaces.map(s => s.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {spaces.map((space) => (
                        <SortableSpaceItem key={space.id} space={space} isActivePath={false} />
                    ))}
                </SortableContext>
            </div>
        </div>
    );
}

// --- Main Sidebar Component ---

export function Sidebar({
    communityName = "WellDo Topluluğu",
    spaces = [],
    groups = [],
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

    // Add transition for server actions
    const [isPending, startTransition] = useTransition();

    // Filter spaces based on enabledFeatures
    const filteredSpaces = useMemo(() => spaces?.filter(space => {
        if (space.type === 'course' && enabledFeatures?.courses === false) return false;
        return true;
    }) || [], [spaces, enabledFeatures?.courses]);

    // Local State for DnD
    const [orderedGroups, setOrderedGroups] = useState<RenderGroup[]>([]);

    useEffect(() => {
        // Initialize or Sync state
        const groupsMap: Record<string, RenderGroup> = {};

        // 1. Groups
        groups?.forEach(g => {
            groupsMap[g.id] = { id: g.id, title: g.name, position: g.position || 0, spaces: [] };
        });

        // 2. Ungrouped
        if (!groupsMap['ungrouped']) {
            groupsMap['ungrouped'] = { id: 'ungrouped', title: 'Alanlar', position: 9999, spaces: [] };
        }

        // 3. Spaces
        filteredSpaces.forEach((space: any) => {
            // Cast space to SidebarChannel
            const s = space as SidebarChannel;
            const groupId = s.group_id || space.group?.id; // Handle both cases for robustness
            const targetId = (groupId && groupsMap[groupId]) ? groupId : 'ungrouped';
            if (groupsMap[targetId]) {
                groupsMap[targetId].spaces.push(s);
            } else {
                // Fallback if group not found
                groupsMap['ungrouped'].spaces.push(s);
            }
        });

        // 4. Sort Groups
        let sorted = Object.values(groupsMap).sort((a, b) => a.position - b.position);

        // Filter out empty ungrouped section (since we migrated to real groups, 
        // or just want to confirm it's not shown if empty)
        sorted = sorted.filter(g => g.id !== 'ungrouped' || g.spaces.length > 0);

        // Sort spaces within groups
        sorted.forEach(g => {
            g.spaces.sort((a, b) => (a.position || 0) - (b.position || 0));
        });

        setOrderedGroups(sorted);
    }, [groups, filteredSpaces]);

    const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
    const [activeItem, setActiveItem] = useState<any>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // 8px movement before drag starts
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleCreateSpace = (groupId: string) => {
        setInitialGroupId(groupId === 'ungrouped' ? 'none' : groupId);
        setIsCreateSpaceOpen(true);
    };

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const { id } = active;
        setActiveId(id);

        // Find the active item (Space or Group)
        const activeGroup = orderedGroups.find(g => g.id === id);
        if (activeGroup) {
            setActiveItem({ dndType: 'GROUP', ...activeGroup });
            return;
        }

        // Find space
        for (const group of orderedGroups) {
            const space = group.spaces.find((s) => s.id === id);
            if (space) {
                setActiveItem({ dndType: 'SPACE', ...space });
                return;
            }
        }
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        // Find which group the active item belongs to
        const activeGroup = orderedGroups.find(g => g.spaces.some((s) => s.id === activeId));
        if (!activeGroup) return; // Must be dragging a space

        const activeGroupId = activeGroup.id;

        // Find which group the over item belongs to (or is)
        const overGroup = orderedGroups.find(g => g.id === overId) ||
            orderedGroups.find(g => g.spaces.some((s) => s.id === overId));

        if (!overGroup) return;
        const overGroupId = overGroup.id;

        if (activeGroupId === overGroupId) return;

        setOrderedGroups((prev) => {
            const activeGroupIdx = prev.findIndex(g => g.id === activeGroupId);
            const overGroupIdx = prev.findIndex(g => g.id === overGroupId);

            if (activeGroupIdx === -1 || overGroupIdx === -1) return prev;

            const activeGroup = prev[activeGroupIdx];
            const overGroup = prev[overGroupIdx];

            const activeSpace = activeGroup.spaces.find((s) => s.id === activeId);
            if (!activeSpace) return prev;

            // Remove from source
            const newActiveSpaces = activeGroup.spaces.filter((s) => s.id !== activeId);

            // Add to target
            const newOverSpaces = [...overGroup.spaces];

            const overSpaceIndex = overGroup.spaces.findIndex((s) => s.id === overId);

            let newIndex = newOverSpaces.length;
            const isOverGroup = prev.some(g => g.id === overId);

            if (overId === overGroupId && isOverGroup) {
                newIndex = newOverSpaces.length + 1;
            } else if (overSpaceIndex >= 0) {
                const isBelowOverItem =
                    over &&
                    active.rect.current.translated &&
                    active.rect.current.translated.top >
                    over.rect.top + over.rect.height;

                const modifier = isBelowOverItem ? 1 : 0;
                newIndex = overSpaceIndex + modifier;
            }

            if (!newOverSpaces.some(s => s.id === activeId)) {
                newOverSpaces.splice(newIndex, 0, { ...activeSpace, group_id: overGroupId === 'ungrouped' ? null : overGroupId });
            }

            const newGroups = [...prev];
            newGroups[activeGroupIdx] = { ...activeGroup, spaces: newActiveSpaces };
            newGroups[overGroupIdx] = { ...overGroup, spaces: newOverSpaces };

            return newGroups;
        });
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        setActiveId(null);
        setActiveItem(null);

        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        // Case 1: Reordering Groups
        if (active.data.current?.dndType === 'GROUP') {
            if (activeId !== overId) {
                const oldIndex = orderedGroups.findIndex(g => g.id === activeId);
                const newIndex = orderedGroups.findIndex(g => g.id === overId);

                if (oldIndex !== -1 && newIndex !== -1) {
                    const newItems = arrayMove(orderedGroups, oldIndex, newIndex);
                    setOrderedGroups(newItems);

                    const updates = newItems.map((g, index) => ({ id: g.id, position: index }));

                    startTransition(() => {
                        reorderGroups(updates).catch(console.error);
                    });
                }
            }
            return;
        }

        // Case 2: Reordering Spaces
        const activeGroup = orderedGroups.find(g => g.spaces.find((s) => s.id === activeId));
        const overGroup = orderedGroups.find(g => g.id === overId) ||
            orderedGroups.find(g => g.spaces.find((s) => s.id === overId));

        if (activeGroup && overGroup) {
            const activeGroupId = activeGroup.id;
            const overGroupId = overGroup.id;

            if (activeGroupId === overGroupId) {
                // Same group reorder (or moved into this group by DragOver)
                const oldIndex = activeGroup.spaces.findIndex((s) => s.id === activeId);
                const newIndex = activeGroup.spaces.findIndex((s) => s.id === overId);

                const originalGroupId = active.data.current?.parentId;
                const currentGroupId = activeGroupId;
                const hasChangedGroup = originalGroupId !== currentGroupId;

                if (oldIndex !== newIndex || hasChangedGroup) {
                    const groupIndex = orderedGroups.findIndex(g => g.id === activeGroupId);
                    if (groupIndex !== -1) {
                        const newSpaces = arrayMove(orderedGroups[groupIndex].spaces, oldIndex, newIndex);

                        const newItems = [...orderedGroups];
                        newItems[groupIndex] = { ...orderedGroups[groupIndex], spaces: newSpaces };

                        setOrderedGroups(newItems);

                        const updates = newSpaces.map((s, idx) => ({
                            id: s.id,
                            groupId: activeGroupId === 'ungrouped' ? null : activeGroupId,
                            position: idx
                        }));

                        startTransition(() => {
                            reorderChannels(updates).catch(console.error);
                        });
                    }
                }
            } else {
                // Moved to different group (finalization)
                // We assume state is already updated by dragOver since it handles cross-group movement optimistically.
                // We just need to persist the current order of the destination group.

                const destGroup = orderedGroups.find(g => g.id === overGroupId);
                if (destGroup) {
                    const updates = destGroup.spaces.map((s, idx) => ({
                        id: s.id,
                        groupId: overGroupId === 'ungrouped' ? null : overGroupId,
                        position: idx
                    }));

                    startTransition(() => {
                        reorderChannels(updates).catch(console.error);
                    });
                }
            }
        }
    };

    const dropAnimation: DropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({
            styles: {
                active: {
                    opacity: '0.5',
                },
            },
        }),
    };

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

                <div className="space-y-6 mt-6">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={orderedGroups.map(g => g.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {orderedGroups.map((group) => (
                                <SortableGroupItem
                                    key={group.id}
                                    group={group}
                                    spaces={group.spaces}
                                    canCreateSpace={!!canCreateSpace}
                                    handleCreateSpace={handleCreateSpace}
                                    handleCreateSpaceGroup={() => setIsCreateSpaceGroupOpen(true)}
                                />
                            ))}
                        </SortableContext>

                        <DragOverlay dropAnimation={dropAnimation}>
                            {activeItem ? (
                                activeItem.dndType === 'GROUP' ? (
                                    <div className="flex items-center justify-between px-3 mb-2 min-h-[20px] bg-slate-800 p-2 rounded opacity-80">
                                        <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">{activeItem.title}</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm text-white bg-slate-700">
                                        <MessageSquare className="w-4 h-4" />
                                        <span>{activeItem.name}</span>
                                    </div>
                                )
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                </div>

                <SidebarLinksSection
                    communityId={spaces?.[0]?.community_id || ""}
                    canEdit={canCreateSpace || false}
                    initialLinks={links}
                />
            </nav>

            {enabledFeatures?.events && (
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
                communityId={spaces?.[0]?.community_id || ""}
                groups={orderedGroups
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
                groups={orderedGroups
                    .filter(g => g.id !== 'ungrouped')
                    .map(g => ({ id: g.id, name: g.title }))}
                initialGroupId={initialGroupId}
            />
        </aside>
    );
}
