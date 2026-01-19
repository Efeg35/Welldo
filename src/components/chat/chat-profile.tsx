"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Video, MapPin, Calendar, Edit, Star } from "lucide-react";

interface ChatProfileProps {
    user: any; // Using any for agility
}

export function ChatProfile({ user }: ChatProfileProps) {
    if (!user) {
        return (
            <div className="w-80 border-l border-border bg-card hidden xl:flex items-center justify-center p-6 text-muted-foreground text-center">
                <p>Profil görüntülemek için bir sohbet seçin.</p>
            </div>
        );
    }

    return (
        <div className="w-80 border-l border-border bg-card overflow-y-auto hidden xl:block">
            {/* Profile Header */}
            <div className="p-6 text-center border-b border-border">
                <Avatar className="w-20 h-20 mx-auto mb-4 border-4 border-[#408FED]/20">
                    <AvatarImage src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} />
                    <AvatarFallback>{user.full_name?.[0] || '?'}</AvatarFallback>
                </Avatar>
                <h3 className="font-semibold text-lg">{user.full_name}</h3>
                <p className="text-sm text-muted-foreground capitalize">{user.role || 'Üye'}</p>
                <div className="flex items-center justify-center gap-2 mt-4">
                    <Button variant="outline" size="sm" className="gap-1">
                        <Mail className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1">
                        <Video className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Profile Details */}
            <div className="p-4 space-y-4">
                <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-[#408FED] truncate">{user.email || 'hidden'}</span>
                </div>
                {/* Placeholder details for now */}
                <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>İstanbul, TR</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>Temmuz 2024'ten beri üye</span>
                </div>

                {/* Bio */}
                <div>
                    <h4 className="text-sm font-medium mb-2">Biyografi</h4>
                    <p className="text-sm text-muted-foreground">
                        {user.bio || "Henüz bir biyografi eklenmemiş."}
                    </p>
                </div>
            </div>
        </div>
    );
}
