"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Search, Download, Trash2, Plus, Clipboard, Loader2, ShieldBan } from "lucide-react";
import { Profile } from "@/types";
import { addSpaceMember, removeSpaceMember, searchUsers, getSpaceMembers } from "@/actions/community";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface SpaceMembersProps {
    channelId: string;
    initialMembers: Profile[];
    hideMemberCount?: boolean;
    allowInvite?: boolean;
    isAdmin?: boolean;
}

type MemberWithDate = Profile & { joined_at?: string };

export function SpaceMembers({
    channelId,
    initialMembers,
    hideMemberCount = false,
    allowInvite = true,
    isAdmin = false
}: SpaceMembersProps) {
    // Initialize with props, but fetch detailed data immediately
    const [members, setMembers] = useState<MemberWithDate[]>(
        initialMembers.map(m => ({ ...m, joined_at: undefined }))
    );
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Add Member State
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const [addSearchQuery, setAddSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Profile[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        loadMembers();
    }, [channelId]);

    const loadMembers = async () => {
        try {
            const data = await getSpaceMembers(channelId);
            setMembers(data as any);
        } catch (error) {
            console.error("Failed to load members", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Filter members for display
    const filteredMembers = members.filter(member =>
        member.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDownloadCSV = () => {
        const headers = ["Ad Soyad", "E-posta", "Rol", "Kayıt Tarihi", "Durum"];
        const rows = filteredMembers.map(m => [
            m.full_name || "",
            m.email || "",
            m.role === 'admin' ? 'Yönetici' : 'Üye',
            m.joined_at ? format(new Date(m.joined_at), "d MMM yyyy", { locale: tr }) : "-",
            'Aktif'
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "uye_listesi.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Add Member Search Handler
    const handleAddSearch = async (query: string) => {
        setAddSearchQuery(query);
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const results = await searchUsers(query);
            const currentMemberIds = new Set(members.map(m => m.id));
            setSearchResults(results.filter((r: any) => !currentMemberIds.has(r.id)) as unknown as Profile[]);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleAddMember = async (user: Profile) => {
        try {
            await addSpaceMember(channelId, user.id);
            setMembers([...members, { ...user, joined_at: new Date().toISOString() }]);
            setSearchResults(prev => prev.filter(r => r.id !== user.id));
            toast.success(`${user.full_name} eklendi`);
        } catch (error) {
            toast.error("Üye eklenemedi");
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!confirm("Bu üyeyi çıkarmak istediğinize emin misiniz?")) return;
        try {
            await removeSpaceMember(channelId, userId);
            setMembers(members.filter(m => m.id !== userId));
            toast.success("Üye çıkarıldı");
        } catch (error) {
            toast.error("Üye çıkarılamadı");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold">Kayıtlı Öğrenciler</h2>
                    {(isAdmin || !hideMemberCount) && (
                        <span className="text-gray-500 text-sm">({filteredMembers.length})</span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {isAdmin && (
                        <Button variant="outline" size="sm" onClick={handleDownloadCSV} disabled={members.length === 0}>
                            <Download className="w-4 h-4 mr-2" />
                            CSV İndir
                        </Button>
                    )}

                    {/* Add Member Dialog */}
                    {(isAdmin || allowInvite) && (
                        <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" className="bg-gray-900 text-white hover:bg-gray-800">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Üye Ekle
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Üye Ekle</DialogTitle>
                                </DialogHeader>
                                <div className="py-4 space-y-4">
                                    <Input
                                        placeholder="İsim ara..."
                                        value={addSearchQuery}
                                        onChange={(e) => handleAddSearch(e.target.value)}
                                        autoFocus
                                    />
                                    <div className="max-h-[300px] overflow-y-auto border rounded-md">
                                        {addSearchQuery.length < 2 ? (
                                            <div className="p-4 text-center text-sm text-muted-foreground">Aramak için en az 2 karakter girin.</div>
                                        ) : isSearching ? (
                                            <div className="p-4 text-center text-sm text-muted-foreground">Aranıyor...</div>
                                        ) : searchResults.length > 0 ? (
                                            <div className="divide-y">
                                                {searchResults.map(user => (
                                                    <div key={user.id} className="flex items-center justify-between p-3 hover:bg-gray-50">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-8 w-8">
                                                                <AvatarImage src={user.avatar_url || ""} />
                                                                <AvatarFallback className="bg-gray-100 text-gray-700 font-semibold text-xs">
                                                                    {getInitials(user.full_name as string)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="text-sm font-medium">{user.full_name}</div>
                                                        </div>
                                                        <Button size="sm" variant="ghost" onClick={() => handleAddMember(user)}>
                                                            <Plus className="w-4 h-4 text-blue-600" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-4 text-center text-sm text-muted-foreground">Sonuç bulunamadı.</div>
                                        )}
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                    placeholder="Öğrenci ara..."
                    className="pl-9 bg-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="border rounded-lg bg-white overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b text-gray-500 font-medium uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-3">ÜYE</th>
                            <th className="px-6 py-3">KAYIT TARİHİ</th>
                            <th className="px-6 py-3">DURUM</th>
                            <th className="px-6 py-3 text-right">AKSİYONLAR</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredMembers.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                    Öğrenci bulunamadı.
                                </td>
                            </tr>
                        ) : (
                            filteredMembers.map((member) => (
                                <tr key={member.id} className="hover:bg-gray-50/50 group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={member.avatar_url || ""} />
                                                <AvatarFallback className="bg-gray-100 text-gray-700 font-semibold">
                                                    {getInitials(member.full_name as string)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-900">{member.full_name}</span>
                                                <span className="text-xs text-gray-500">{member.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        {member.joined_at
                                            ? format(new Date(member.joined_at), "d MMM yyyy", { locale: tr })
                                            : "Bilinmiyor"
                                        }
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 font-normal">Aktif</Badge>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 group-hover:text-gray-600">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => {
                                                    if (member.email) {
                                                        navigator.clipboard.writeText(member.email);
                                                        toast.success("E-posta kopyalandı");
                                                    }
                                                }}>
                                                    <Clipboard className="w-4 h-4 mr-2" />
                                                    E-postayı Kopyala
                                                </DropdownMenuItem>
                                                {isAdmin && (
                                                    <DropdownMenuItem onClick={() => handleRemoveMember(member.id)} className="text-red-600 focus:text-red-600">
                                                        <ShieldBan className="w-4 h-4 mr-2" />
                                                        Erişimi Kaldır
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
