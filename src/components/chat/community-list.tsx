"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageCircle } from "lucide-react";
import type { Community, Channel } from "@/types";

interface CommunityWithChannel extends Community {
    channels: Channel[];
    last_message?: string;
    last_message_time?: string;
}

export function CommunityList() {
    const supabase = createClient();
    const [communities, setCommunities] = useState<CommunityWithChannel[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCommunities = async () => {
            // Get user's memberships with communities
            const { data: memberships } = await supabase
                .from("memberships")
                .select(`
          community:communities(
            *,
            channels(*)
          )
        `)
                .eq("status", "active");

            if (memberships) {
                const comms = memberships
                    .map((m) => m.community as unknown as CommunityWithChannel)
                    .filter(Boolean);
                setCommunities(comms);
            }
            setLoading(false);
        };

        fetchCommunities();
    }, [supabase]);

    // Format relative time
    const formatRelativeTime = (dateString?: string) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return "Şimdi";
        if (diffMins < 60) return `${diffMins}dk`;
        if (diffHours < 24) return `${diffHours}s`;
        if (diffDays === 1) return "Dün";
        return date.toLocaleDateString("tr-TR");
    };

    if (loading) {
        return (
            <div className="flex flex-1 items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
            </div>
        );
    }

    if (communities.length === 0) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-500/10">
                    <MessageCircle className="h-8 w-8 text-violet-500" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold">Henüz topluluk yok</h2>
                    <p className="text-sm text-muted-foreground">
                        Bir topluluğa katılarak sohbete başla!
                    </p>
                </div>
                <Link
                    href="/store"
                    className="text-sm font-medium text-violet-500 hover:underline"
                >
                    Toplulukları Keşfet →
                </Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col">
            {communities.map((community) => {
                const defaultChannel = community.channels?.find((c) => c.is_default);
                const channelId = defaultChannel?.id || community.channels?.[0]?.id;

                return (
                    <Link
                        key={community.id}
                        href={channelId ? `/chat/${community.id}/${channelId}` : "#"}
                        className="flex items-center gap-3 border-b border-border px-4 py-3 transition-colors hover:bg-muted/50"
                    >
                        <Avatar className="h-12 w-12">
                            <AvatarImage
                                src={community.cover_image_url || undefined}
                                alt={community.name}
                            />
                            <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                                {community.name[0]}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                            <div className="flex items-center justify-between">
                                <h3 className="font-medium">{community.name}</h3>
                                <span className="text-xs text-muted-foreground">
                                    {formatRelativeTime(community.last_message_time)}
                                </span>
                            </div>
                            <p className="truncate text-sm text-muted-foreground">
                                {community.last_message || community.description || "Sohbete başla!"}
                            </p>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}
