"use client";

import { Member } from "@/actions/members";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    MessageCircle,
    UserPlus,
    MoreHorizontal,
    Mail,
    Calendar,
    Award,
    Shield,
    Trash2,
    Eye
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { getInitials } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MemberProfilePanelProps {
    member: Member | null;
    open: boolean;
    onClose: () => void;
    isAdmin: boolean;
}

export function MemberProfilePanel({ member, open, onClose, isAdmin }: MemberProfilePanelProps) {
    if (!member) return null;

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
        <Sheet open={open} onOpenChange={onClose}>
            <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                <SheetHeader className="pb-4">
                    <div className="flex items-start justify-between">
                        <SheetTitle className="sr-only">Üye Profili</SheetTitle>
                        {isAdmin && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem>
                                        <Eye className="w-4 h-4 mr-2" />
                                        Bu üye olarak görüntüle
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <Shield className="w-4 h-4 mr-2" />
                                        Rol değiştir
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-red-600">
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Üyeyi kaldır
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </SheetHeader>

                {/* Profile Header */}
                <div className="flex flex-col items-center text-center pb-6 border-b">
                    <Avatar className="w-24 h-24 mb-4 border-4 border-gray-100">
                        <AvatarImage src={member.avatar_url || ""} />
                        <AvatarFallback className="text-2xl bg-gray-100 text-gray-500">
                            {getInitials(member.full_name || "U")}
                        </AvatarFallback>
                    </Avatar>

                    <h2 className="text-xl font-bold text-gray-900 mb-1">
                        {member.full_name || "İsimsiz Üye"}
                    </h2>

                    <div className="mb-3">
                        {getRoleBadge(member.role)}
                    </div>

                    {member.bio && (
                        <p className="text-sm text-gray-500 max-w-xs">
                            {member.bio}
                        </p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm" className="gap-2">
                            <UserPlus className="w-4 h-4" />
                            Takip Et
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2">
                            <MessageCircle className="w-4 h-4" />
                            Mesaj
                        </Button>
                    </div>
                </div>

                {/* Profile Details */}
                <div className="py-4 space-y-4">
                    <div className="flex items-center gap-3 text-sm">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{member.email || "E-posta yok"}</span>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                            {format(new Date(member.joined_at), "d MMMM yyyy", { locale: tr })} tarihinde katıldı
                        </span>
                    </div>

                    {member.activity_score !== undefined && (
                        <div className="flex items-center gap-3 text-sm">
                            <Award className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">Aktivite Puanı: {member.activity_score}</span>
                        </div>
                    )}
                </div>

                {/* Tabs for Content/Activity */}
                <Tabs defaultValue="activity" className="mt-4">
                    <TabsList className="w-full">
                        <TabsTrigger value="activity" className="flex-1">Aktivite</TabsTrigger>
                        <TabsTrigger value="content" className="flex-1">İçerik</TabsTrigger>
                        <TabsTrigger value="spaces" className="flex-1">Alanlar</TabsTrigger>
                    </TabsList>

                    <TabsContent value="activity" className="mt-4">
                        <div className="text-center py-8 text-gray-500 text-sm">
                            Henüz aktivite yok
                        </div>
                    </TabsContent>

                    <TabsContent value="content" className="mt-4">
                        <div className="text-center py-8 text-gray-500 text-sm">
                            Henüz içerik paylaşılmamış
                        </div>
                    </TabsContent>

                    <TabsContent value="spaces" className="mt-4">
                        <div className="text-center py-8 text-gray-500 text-sm">
                            Erişilebilir alanlar yakında
                        </div>
                    </TabsContent>
                </Tabs>
            </SheetContent>
        </Sheet>
    );
}
