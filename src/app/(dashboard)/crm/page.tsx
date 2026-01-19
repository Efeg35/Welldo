import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Search,
    Plus,
    MoreHorizontal,
    Users,
    Link2,
    Tags,
    UserCircle,
    FileText,
    ChevronDown
} from "lucide-react";

// Sample member data
const sampleMembers = [
    { id: "1", name: "Kemal Adalı", email: "adebayo@gmail.com", score: 9.2, role: "Üye", joined: "12 Nis, 2024" },
    { id: "2", name: "Rıza Soylu", email: "robertfox@saas.com", score: 9.4, role: "Üye", joined: "5 Mar, 2024" },
    { id: "3", name: "Melek Arslan", email: "wongmei@gmail.com", score: 6.0, role: "Üye", joined: "22 Haz, 2024" },
    { id: "4", name: "Deniz Yıldız", email: "dirussel@yahoo.com", score: 8.7, role: "Moderatör", joined: "9 Mar, 2023" },
    { id: "5", name: "Kardelen Vural", email: "kristin@watson.com", score: 8.3, role: "Admin", joined: "19 Eyl, 2022" },
    { id: "6", name: "Can Yılmaz", email: "ramirez@yahoo.com", score: 6.7, role: "Üye", joined: "8 Tem, 2024" },
    { id: "7", name: "Ravi Patel", email: "ravidesigner@gmail.com", score: 9.7, role: "Moderatör", joined: "1 Ara, 2023" },
];

const sidebarItems = [
    { icon: Users, label: "Kitleyi yönet", active: true },
    { icon: FileText, label: "Segmentler" },
    { icon: Link2, label: "Davet bağlantıları" },
    { icon: Tags, label: "Etiketler" },
    { icon: UserCircle, label: "Profil alanları" },
    { icon: FileText, label: "Toplu işlemler" },
];

const tabs = [
    { label: "Tümü", count: 720 },
    { label: "Kişiler", count: 719 },
    { label: "Üyeler", count: 700 },
    { label: "Davetliler", count: 700 },
    { label: "Adminler", count: 4 },
    { label: "Moderatörler", count: 16 },
];

function ScoreBadge({ score }: { score: number }) {
    const color = score >= 8 ? "text-green-600 bg-green-50" :
        score >= 6 ? "text-yellow-600 bg-yellow-50" :
            "text-red-600 bg-red-50";
    return (
        <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium ${color}`}>
            {score.toFixed(1)}
        </span>
    );
}

export default async function CRMPage() {
    return (
        <div className="flex h-full">
            {/* Left Sidebar */}
            <aside className="w-56 border-r border-border p-4 space-y-1">
                <h2 className="font-semibold mb-4">Kitle</h2>
                {sidebarItems.map((item) => (
                    <button
                        key={item.label}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${item.active
                            ? "bg-accent text-foreground font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                            }`}
                    >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                    </button>
                ))}
            </aside>

            {/* Main Content */}
            <div className="flex-1 p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold">Kitleyi yönet</h1>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-5 h-5" />
                        </Button>
                        <Button className="gap-2" style={{ background: 'linear-gradient(135deg, #408FED 0%, #3E1BC9 100%)' }}>
                            <Plus className="w-4 h-4" />
                            Ekle
                        </Button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-4 border-b border-border">
                    {tabs.map((tab, index) => (
                        <button
                            key={tab.label}
                            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${index === 0
                                ? "border-foreground text-foreground"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            {tab.label} <span className="text-muted-foreground">{tab.count}</span>
                        </button>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 flex-wrap">
                    <Button variant="outline" size="sm" className="gap-1">
                        <Plus className="w-3 h-3" /> İsim
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1">
                        <Plus className="w-3 h-3" /> E-posta pazarlama
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1">
                        <Plus className="w-3 h-3" /> Üye
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1">
                        <Plus className="w-3 h-3" /> Kaynak
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1">
                        <Plus className="w-3 h-3" /> Katılma tarihi
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1">
                        <Plus className="w-3 h-3" /> Filtre ekle
                    </Button>
                </div>

                {/* Table Header */}
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">720 kişi</span>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">Segmenti kaydet</Button>
                        <Button variant="outline" size="sm" className="gap-1">
                            Toplu işlemler <ChevronDown className="w-3 h-3" />
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1">
                            Daha fazla <ChevronDown className="w-3 h-3" />
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <div className="border border-border rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">İsim</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Puan</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Rol</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Katıldı</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {sampleMembers.map((member) => (
                                <tr key={member.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="w-10 h-10">
                                                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`} />
                                                <AvatarFallback>{member.name[0]}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-medium">{member.name}</div>
                                                <div className="text-sm text-muted-foreground">{member.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <ScoreBadge score={member.score} />
                                    </td>
                                    <td className="px-4 py-4 text-sm">{member.role}</td>
                                    <td className="px-4 py-4 text-sm text-muted-foreground">{member.joined}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
