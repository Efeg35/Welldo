"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Star } from "lucide-react";
import { getLeaderboard } from "@/actions/gamification";

interface LeaderboardProps {
    communityId: string;
}

interface LeaderboardEntry {
    points: number;
    level: number;
    user_id: string;
    user: {
        full_name: string | null;
        avatar_url: string | null;
    } | null;
}

export function Leaderboard({ communityId }: LeaderboardProps) {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            const data = await getLeaderboard(communityId);
            // @ts-ignore
            setEntries(data || []);
            setLoading(false);
        };

        fetchLeaderboard();
    }, [communityId]);

    if (loading) {
        return <div className="p-4 text-center text-sm text-muted-foreground">Yükleniyor...</div>;
    }

    return (
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 pb-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <h3 className="font-semibold">Liderlik Tablosu</h3>
            </div>

            <div className="flex flex-col gap-2">
                {entries.map((entry, index) => (
                    <div
                        key={entry.user_id}
                        className="flex items-center gap-3 rounded-lg bg-background p-2"
                    >
                        <div className="flex h-6 w-6 items-center justify-center font-bold text-muted-foreground">
                            {index + 1}
                        </div>

                        <Avatar className="h-8 w-8">
                            <AvatarImage
                                src={entry.user?.avatar_url || undefined}
                                alt={entry.user?.full_name || "User"}
                            />
                            <AvatarFallback>
                                {entry.user?.full_name?.[0] || "U"}
                            </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 overflow-hidden">
                            <p className="truncate text-sm font-medium">
                                {entry.user?.full_name || "Kullanıcı"}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-0.5">
                                    <Star className="h-3 w-3 text-yellow-500" />
                                    {entry.points}
                                </span>
                                <span>•</span>
                                <span>Lvl {entry.level}</span>
                            </div>
                        </div>

                        {index < 3 && (
                            <Medal
                                className={`h-5 w-5 ${index === 0
                                        ? "text-yellow-500"
                                        : index === 1
                                            ? "text-gray-400"
                                            : "text-amber-600"
                                    }`}
                            />
                        )}
                    </div>
                ))}

                {entries.length === 0 && (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                        Henüz sıralama yok.
                    </p>
                )}
            </div>
        </div>
    );
}
