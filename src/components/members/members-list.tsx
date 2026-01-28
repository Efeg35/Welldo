"use client";

import { Member } from "@/actions/members";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/utils";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { MoreHorizontal, MessageCircle, UserPlus, Shield, Trash2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MembersListProps {
    members: Member[];
    isLoading?: boolean;
    onMemberClick?: (member: Member) => void;
}

export function MembersList({ members, isLoading, onMemberClick }: MembersListProps) {
    if (isLoading) {
        return (
            <div className="border border-border rounded-xl overflow-hidden bg-white">
                <div className="animate-pulse">
                    <div className="h-12 bg-gray-100 border-b" />
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4 px-6 py-4 border-b">
                            <div className="w-8 h-8 rounded-full bg-gray-200" />
                            <div className="flex-1">
                                <div className="w-32 h-4 bg-gray-200 rounded" />
                            </div>
                            <div className="w-16 h-4 bg-gray-100 rounded" />
                            <div className="w-24 h-4 bg-gray-100 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (members.length === 0) {
        return <div className="p-10 text-center text-muted-foreground">Üye bulunamadı.</div>;
    }

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin':
                return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">Yönetici</Badge>;
            case 'instructor':
                return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Eğitmen</Badge>;
            default:
                return <Badge variant="secondary">Üye</Badge>;
        }
    };

    return (
        <div className="border border-border rounded-xl overflow-hidden bg-white">
            <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 border-b border-border">
                    <tr>
                        <th className="px-6 py-3 font-medium text-muted-foreground">Üye</th>
                        <th className="px-6 py-3 font-medium text-muted-foreground">Rol</th>
                        <th className="px-6 py-3 font-medium text-muted-foreground">Aktivite Puanı</th>
                        <th className="px-6 py-3 font-medium text-muted-foreground">Katılma Tarihi</th>
                        <th className="px-6 py-3 font-medium text-muted-foreground text-right">İşlem</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {members.map((member) => (
                        <tr
                            key={member.id}
                            className="hover:bg-muted/30 transition-colors cursor-pointer"
                            onClick={() => onMemberClick?.(member)}
                        >
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <Avatar className="w-8 h-8">
                                        <AvatarImage src={member.avatar_url || ""} />
                                        <AvatarFallback className="text-xs">
                                            {getInitials(member.full_name || "U")}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <span className="font-medium text-foreground">
                                            {member.full_name || "İsimsiz Üye"}
                                        </span>
                                        {member.email && (
                                            <p className="text-xs text-muted-foreground">{member.email}</p>
                                        )}
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                {getRoleBadge(member.role)}
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-green-500 rounded-full"
                                            style={{ width: `${Math.min((member.activity_score || 0), 100)}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {member.activity_score || 0}
                                    </span>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-muted-foreground">
                                {format(new Date(member.joined_at), "d MMM yyyy", { locale: tr })}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                        <DropdownMenuItem>
                                            <MessageCircle className="w-4 h-4 mr-2" />
                                            Mesaj gönder
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <UserPlus className="w-4 h-4 mr-2" />
                                            Takip et
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem>
                                            <Shield className="w-4 h-4 mr-2" />
                                            Rol değiştir
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-red-600">
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Üyeyi kaldır
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
