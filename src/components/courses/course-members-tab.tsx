"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Search, Download, ShieldBan, Clipboard } from "lucide-react";
import { getCourseStudents, revokeCourseAccess } from "@/actions/courses";
import { Loader2 } from "lucide-react";

interface CourseMembersTabProps {
    courseId: string;
}

export function CourseMembersTab({ courseId }: CourseMembersTabProps) {
    const [students, setStudents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        loadStudents();
    }, [courseId]);

    const loadStudents = async () => {
        setIsLoading(true);
        try {
            const data = await getCourseStudents(courseId);
            setStudents(data);
        } catch (error) {
            console.error("Failed to load students", error);
            toast.error("Öğrenci listesi yüklenemedi");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRevokeAccess = async (userId: string) => {
        if (!confirm("Bu kullanıcının ders erişimini kaldırmak istediğinize emin misiniz?")) return;

        try {
            await revokeCourseAccess(courseId, userId);
            toast.success("Erişim kaldırıldı");
            loadStudents(); // Reload list
        } catch (error) {
            toast.error("İşlem başarısız oldu");
        }
    };

    const filteredStudents = students.filter(student =>
        student.profiles.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.profiles.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDownloadCSV = () => {
        // Simple CSV export
        const headers = ["Ad Soyad", "E-posta", "Kayıt Tarihi", "Durum"];
        const rows = filteredStudents.map(s => [
            s.profiles.full_name,
            s.profiles.email,
            format(new Date(s.enrolled_at), "d MMM yyyy", { locale: tr }),
            s.status === 'revoked' ? 'İptal Edildi' : 'Aktif'
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "ogrenci_listesi.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading) {
        return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold">Kayıtlı Öğrenciler</h2>
                    <span className="text-gray-500 text-sm">({filteredStudents.length})</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleDownloadCSV} disabled={students.length === 0}>
                        <Download className="w-4 h-4 mr-2" />
                        CSV İndir
                    </Button>
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
                    <thead className="bg-gray-50 border-b text-gray-500 font-medium uppercasetracking-wider">
                        <tr>
                            <th className="px-6 py-3">ÖĞRENCİ</th>
                            <th className="px-6 py-3">KAYIT TARİHİ</th>
                            <th className="px-6 py-3">DURUM</th>
                            <th className="px-6 py-3 text-right">AKSİYONLAR</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredStudents.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                    Öğrenci bulunamadı.
                                </td>
                            </tr>
                        ) : (
                            filteredStudents.map((student) => (
                                <tr key={student.id} className="hover:bg-gray-50/50 group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={student.profiles.avatar_url} />
                                                <AvatarFallback>{student.profiles.full_name[0]}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-900">{student.profiles.full_name}</span>
                                                <span className="text-xs text-gray-500">{student.profiles.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        {format(new Date(student.enrolled_at), "d MMM yyyy", { locale: tr })}
                                    </td>
                                    <td className="px-6 py-4">
                                        {student.status === 'revoked' ? (
                                            <Badge variant="destructive" className="font-normal">İptal Edildi</Badge>
                                        ) : (
                                            <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 font-normal">Erişimi Var</Badge>
                                        )}
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
                                                    navigator.clipboard.writeText(student.profiles.email);
                                                    toast.success("E-posta kopyalandı");
                                                }}>
                                                    <Clipboard className="w-4 h-4 mr-2" />
                                                    E-postayı Kopyala
                                                </DropdownMenuItem>
                                                {student.status !== 'revoked' && (
                                                    <DropdownMenuItem onClick={() => handleRevokeAccess(student.user_id)} className="text-red-600 focus:text-red-600">
                                                        <ShieldBan className="w-4 h-4 mr-2" />
                                                        Dersten Çıkar
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
