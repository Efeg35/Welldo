"use client";

import { MembersEmptyState } from "./members-empty-state";
import { Member } from "@/actions/members";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/utils";
import { MapPin, MessageCircle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MembersGridProps {
    members: Member[];
    isLoading?: boolean;
    onMemberClick?: (member: Member) => void;
    onAddMember?: () => void;
}

export function MembersGrid({ members, isLoading, onMemberClick, onAddMember }: MembersGridProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-white border border-border rounded-xl p-6 animate-pulse">
                        <div className="flex flex-col items-center">
                            <div className="w-20 h-20 rounded-full bg-gray-200 mb-4" />
                            <div className="w-24 h-4 bg-gray-200 rounded mb-2" />
                            <div className="w-16 h-3 bg-gray-100 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (members.length === 0) {
        return <MembersEmptyState onAddMember={onAddMember} />;
    }

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'admin':
                return 'bg-purple-100 text-purple-700';
            case 'instructor':
                return 'bg-blue-100 text-blue-700';
            default:
                return 'bg-gray-100 text-gray-600';
        }
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {members.map((member) => (
                <div
                    key={member.id}
                    className="flex flex-col items-center text-center bg-white border border-border rounded-xl p-6 hover:shadow-md transition-all cursor-pointer group"
                    onClick={() => onMemberClick?.(member)}
                >
                    <Avatar className="w-20 h-20 mb-4 border-2 border-gray-100 group-hover:border-gray-200 transition-colors">
                        <AvatarImage src={member.avatar_url || ""} />
                        <AvatarFallback className="text-lg bg-gray-100 text-gray-500">
                            {getInitials(member.full_name || "U")}
                        </AvatarFallback>
                    </Avatar>

                    <h3 className="font-semibold text-lg truncate w-full" title={member.full_name || ""}>
                        {member.full_name || "İsimsiz Üye"}
                    </h3>

                    <Badge className={`mt-2 ${getRoleBadgeColor(member.role)}`} variant="secondary">
                        {member.role === 'admin' ? 'Yönetici' :
                            member.role === 'instructor' ? 'Eğitmen' : 'Üye'}
                    </Badge>

                    {member.location && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-3">
                            <MapPin className="w-3 h-3" />
                            <span>{member.location}</span>
                        </div>
                    )}

                    {/* Hover Actions */}
                    <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-3"
                            onClick={(e) => {
                                e.stopPropagation();
                                // TODO: Follow action
                            }}
                        >
                            <UserPlus className="w-3.5 h-3.5 mr-1" />
                            Takip
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-3"
                            onClick={(e) => {
                                e.stopPropagation();
                                // TODO: Message action
                            }}
                        >
                            <MessageCircle className="w-3.5 h-3.5 mr-1" />
                            Mesaj
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
}
