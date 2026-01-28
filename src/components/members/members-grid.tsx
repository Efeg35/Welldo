"use client";

import { MembersEmptyState } from "./members-empty-state";

import { Member } from "@/actions/members";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/utils";
import { MapPin } from "lucide-react";

interface MembersGridProps {
    members: Member[];
    isLoading?: boolean;
}

export function MembersGrid({ members, isLoading }: MembersGridProps) {
    if (isLoading) {
        return <div className="p-10 text-center">Yükleniyor...</div>;
    }

    if (members.length === 0) {
        return <MembersEmptyState />;
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {members.map((member) => (
                <div
                    key={member.id}
                    className="flex flex-col items-center text-center bg-white border border-border rounded-xl p-6 hover:shadow-sm transition-shadow group"
                >
                    <Avatar className="w-20 h-20 mb-4 border-2 border-gray-100">
                        <AvatarImage src={member.avatar_url || ""} />
                        <AvatarFallback className="text-lg bg-gray-100 text-gray-500">
                            {getInitials(member.full_name || "U")}
                        </AvatarFallback>
                    </Avatar>

                    <h3 className="font-semibold text-lg truncate w-full" title={member.full_name || ""}>
                        {member.full_name || "İsimsiz Üye"}
                    </h3>

                    <p className="text-sm text-muted-foreground mb-3 capitalize">
                        {member.role === 'admin' ? 'Yönetici' :
                            member.role === 'instructor' ? 'Eğitmen' : 'Üye'}
                    </p>

                    {member.location && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-4">
                            <MapPin className="w-3 h-3" />
                            <span>{member.location}</span>
                        </div>
                    )}

                    <div className="mt-auto w-full pt-4">
                        <button className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-sm font-medium rounded-lg text-gray-700 transition-colors">
                            Profili Görüntüle
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
