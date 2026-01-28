"use client";

import { Member } from "@/actions/members";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface MembersListProps {
    members: Member[];
    isLoading?: boolean;
}

export function MembersList({ members, isLoading }: MembersListProps) {
    if (isLoading) {
        return <div className="p-10 text-center">Yükleniyor...</div>;
    }

    if (members.length === 0) {
        return <div className="p-10 text-center text-muted-foreground">Üye bulunamadı.</div>;
    }

    return (
        <div className="border border-border rounded-xl overflow-hidden bg-white">
            <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 border-b border-border">
                    <tr>
                        <th className="px-6 py-3 font-medium text-muted-foreground">Üye</th>
                        <th className="px-6 py-3 font-medium text-muted-foreground">Rol</th>
                        <th className="px-6 py-3 font-medium text-muted-foreground">Katılma Tarihi</th>
                        <th className="px-6 py-3 font-medium text-muted-foreground text-right">İşlem</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {members.map((member) => (
                        <tr key={member.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <Avatar className="w-8 h-8">
                                        <AvatarImage src={member.avatar_url || ""} />
                                        <AvatarFallback className="text-xs">
                                            {getInitials(member.full_name || "U")}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium text-foreground">
                                        {member.full_name || "İsimsiz Üye"}
                                    </span>
                                </div>
                            </td>
                            <td className="px-6 py-4 capitalize text-muted-foreground">
                                {member.role === 'admin' ? 'Yönetici' :
                                    member.role === 'instructor' ? 'Eğitmen' : 'Üye'}
                            </td>
                            <td className="px-6 py-4 text-muted-foreground">
                                {format(new Date(member.joined_at), "d MMM yyyy", { locale: tr })}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button className="text-xs font-medium text-blue-600 hover:underline">
                                    Görüntüle
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
