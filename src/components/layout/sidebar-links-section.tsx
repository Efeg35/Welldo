"use client";

import { useEffect, useState } from "react";
import { Link as LinkIcon, Plus, Trash2, ExternalLink, MoreHorizontal, Edit2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CreateLinkModal } from "./create-link-modal";
import { EditLinkModal } from "./edit-link-modal";
import { deleteLink, getLinks } from "@/actions/links";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LinkItem {
    id: string;
    label: string;
    url: string;
    icon?: string;
    created_at: string;
}

interface SidebarLinksSectionProps {
    communityId: string;
    canEdit: boolean;
    initialLinks?: LinkItem[];
}

export function SidebarLinksSection({ communityId, canEdit, initialLinks = [] }: SidebarLinksSectionProps) {
    const [links, setLinks] = useState<LinkItem[]>(initialLinks);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingLink, setEditingLink] = useState<LinkItem | null>(null);
    const supabase = createClient();

    // We initialize state with initialLinks. 
    // We avoid a useEffect here to prevent infinite loops if the parent passes a new array reference on every render.
    // If communityId changes, the parent should change the key of this component to reset state.

    // Initial Fetch (as fallback or if not provided)
    useEffect(() => {
        const fetchLinks = async () => {
            if (!communityId || initialLinks.length > 0) return;
            const data = await getLinks(communityId);
            if (data) setLinks(data);
        };
        fetchLinks();
    }, [communityId, initialLinks.length]);
    // Realtime Subscription
    useEffect(() => {
        if (!communityId) return;

        const channel = supabase
            .channel('sidebar-links-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'community_links',
                    filter: `community_id=eq.${communityId}`
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setLinks(prev => [...prev, payload.new as LinkItem]);
                    } else if (payload.eventType === 'DELETE') {
                        setLinks(prev => prev.filter(l => l.id !== payload.old.id));
                    } else if (payload.eventType === 'UPDATE') {
                        setLinks(prev => prev.map(l => l.id === payload.new.id ? payload.new as LinkItem : l));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [communityId, supabase]);

    const handleDelete = async (id: string) => {
        try {
            await deleteLink(id);
            toast.success("Link silindi");
        } catch (error) {
            toast.error("Silinemedi");
        }
    };

    if (links.length === 0 && !canEdit) return null;

    return (
        <div className="mt-4">
            <div className="flex items-center justify-between px-3 mb-2 group/links">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Bağlantılar
                </h3>
                {canEdit && (
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="text-gray-400 hover:text-white transition-colors cursor-pointer opacity-0 group-hover/links:opacity-100"
                        title="Link Ekle"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                )}
            </div>

            <div className="space-y-1">
                {links.map((link) => (
                    <div key={link.id} className="group relative flex items-center">
                        <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors truncate"
                        >
                            <LinkIcon className="w-4 h-4 shrink-0" />
                            <span className="truncate">{link.label}</span>
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-50 ml-auto mr-6" />
                        </a>

                        {canEdit && (
                            <div className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="p-1 hover:bg-white/10 rounded cursor-pointer text-gray-400 hover:text-white outline-none">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-40">
                                        <DropdownMenuItem
                                            className="cursor-pointer"
                                            onClick={() => setEditingLink(link)}
                                        >
                                            <Edit2 className="w-4 h-4 mr-2" />
                                            Düzenle
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="text-red-500 focus:text-red-500 focus:bg-red-50 cursor-pointer"
                                            onClick={() => handleDelete(link.id)}
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Sil
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <CreateLinkModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                communityId={communityId}
            />

            <EditLinkModal
                isOpen={!!editingLink}
                onClose={() => setEditingLink(null)}
                link={editingLink}
            />
        </div>
    );
}
