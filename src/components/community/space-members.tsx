"use client";

import { useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Search, Download, Trash2, Plus, Clipboard } from "lucide-react";
import { Profile } from "@/types";
import { addSpaceMember, removeSpaceMember, searchUsers } from "@/actions/community";
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
}

export function SpaceMembers({ channelId, initialMembers }: SpaceMembersProps) {
    const [members, setMembers] = useState<Profile[]>(initialMembers);
    const [searchQuery, setSearchQuery] = useState("");

    // Add Member State
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const [addSearchQuery, setAddSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Profile[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Filter members for display
    const filteredMembers = members.filter(member =>
        member.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDownloadCSV = () => {
        const headers = ["Ad Soyad", "E-posta", "Rol", "Durum"];
        const rows = filteredMembers.map(m => [
            m.full_name || "",
            m.email || "",
            m.role === 'admin' ? 'Yönetici' : 'Üye',
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
            setMembers([...members, user]);
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
                    <span className="text-gray-500 text-sm">({filteredMembers.length})</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleDownloadCSV} disabled={members.length === 0}>
                        <Download className="w-4 h-4 mr-2" />
                        CSV İndir
                    </Button>

                    {/* Add Member Dialog */}
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
                                                            <AvatarFallback>{user.full_name?.charAt(0)}</AvatarFallback>
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
                                                <AvatarFallback>{member.full_name?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-900">{member.full_name}</span>
                                                <span className="text-xs text-gray-500">{member.role === 'admin' ? 'Yönetici' : 'Üye'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        {format(new Date(), "d MMM yyyy", { locale: tr })}
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
                                                    navigator.clipboard.writeText(member.id);
                                                    toast.success("ID Kopyalandı");
                                                }}>
                                                    <Clipboard className="w-4 h-4 mr-2" />
                                                    ID Kopyala
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleRemoveMember(member.id)} className="text-red-600 focus:text-red-600">
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Üyeyi Çıkar
                                                </DropdownMenuItem>
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
