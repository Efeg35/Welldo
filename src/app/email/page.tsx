import { DashboardLayout } from "@/components/layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    ArrowLeft,
    Check,
    ChevronDown,
    ExternalLink,
    Users
} from "lucide-react";
import Link from "next/link";

export default function EmailMarketingPage() {
    return (
        <DashboardLayout showSidebar={false} showSecondaryNav={false}>
            <div className="flex h-[calc(100vh-112px)]">
                {/* Left Panel - Form */}
                <div className="flex-1 border-r border-border bg-card overflow-y-auto">
                    {/* Header */}
                    <div className="sticky top-0 z-10 bg-card border-b border-border p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Link href="/community">
                                <Button variant="ghost" size="icon">
                                    <ArrowLeft className="w-4 h-4" />
                                </Button>
                            </Link>
                            <span className="font-medium">Yeni yayın oluştur</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="gap-1">
                                İşlemler <ChevronDown className="w-3 h-3" />
                            </Button>
                            <Button variant="outline" size="sm">Test gönder</Button>
                            <Button size="sm" style={{ background: 'linear-gradient(135deg, #408FED 0%, #3E1BC9 100%)' }}>
                                Gönder
                            </Button>
                        </div>
                    </div>

                    {/* Form Content */}
                    <div className="p-6 max-w-2xl">
                        {/* Campaign Title */}
                        <div className="mb-8">
                            <h1 className="text-2xl font-semibold">Yeni Netlik Oturumu</h1>
                            <Badge variant="secondary" className="mt-2">Taslak</Badge>
                        </div>

                        {/* Form Fields */}
                        <div className="space-y-6">
                            {/* To */}
                            <div className="flex items-start gap-4 py-4 border-b border-border">
                                <div className="flex items-center gap-2 min-w-[100px]">
                                    <Check className="w-4 h-4 text-green-500" />
                                    <span className="font-medium">Kime</span>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-muted-foreground" />
                                        <span>Tüm üyeler</span>
                                        <span className="text-muted-foreground">•</span>
                                        <span className="text-[#408FED]">1272 alıcı</span>
                                        <Badge variant="outline" className="ml-1">ℹ️</Badge>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm">Düzenle</Button>
                            </div>

                            {/* Subject */}
                            <div className="flex items-start gap-4 py-4 border-b border-border">
                                <div className="flex items-center gap-2 min-w-[100px]">
                                    <Check className="w-4 h-4 text-green-500" />
                                    <span className="font-medium">Konu</span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-muted-foreground">Şablonların ötesine geçin—koçluk pratiğinizi...</p>
                                </div>
                                <Button variant="ghost" size="sm">Düzenle</Button>
                            </div>

                            {/* Content */}
                            <div className="flex items-start gap-4 py-4 border-b border-border">
                                <div className="flex items-center gap-2 min-w-[100px]">
                                    <Check className="w-4 h-4 text-green-500" />
                                    <span className="font-medium">İçerik</span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-muted-foreground">Son düzenleme: az önce</p>
                                    <a href="#" className="text-[#408FED] text-sm flex items-center gap-1 mt-1">
                                        tarayıcıda görüntüle <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                                <Button variant="ghost" size="sm">Düzenle</Button>
                            </div>

                            {/* Send time */}
                            <div className="flex items-start gap-4 py-4 border-b border-border">
                                <div className="flex items-center gap-2 min-w-[100px]">
                                    <Check className="w-4 h-4 text-green-500" />
                                    <span className="font-medium">Gönderim zamanı</span>
                                </div>
                                <div className="flex-1">
                                    <p>Cum, 24 Nis, 2025 sa 10:00</p>
                                </div>
                                <Button variant="ghost" size="sm">Düzenle</Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Preview */}
                <div className="w-[480px] bg-muted/30 overflow-y-auto p-6">
                    {/* Preview Header */}
                    <div className="bg-card rounded-t-xl p-4 border border-border border-b-0">
                        <p className="text-sm font-medium">Şablonların ötesine geçin—koçluk pratiğinizi güvenle inşa edin</p>
                        <p className="text-xs text-muted-foreground mt-1">Bulunduğunuz yerde sizinle buluşan bir rehberlikle bir sonraki adımınızı atın.</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <span>MB</span>
                            <span>İsim Soyisim</span>
                            <span>&lt;isim.soyisim@domain.tld&gt;</span>
                        </div>
                    </div>

                    {/* Email Content Preview */}
                    <div className="bg-white rounded-b-xl border border-border p-6 space-y-4">
                        <p className="text-sm">Merhaba Melissa,</p>

                        <p className="text-sm text-muted-foreground">
                            Strateji ve yüzeysel tavsiyelerden daha derine inmeye davetlisiniz. Bu
                            yaklaşan Netlik Oturumu'nda, uyumlu, kendinden emin ve sürdürülebilir bir şekilde
                            büyümeye yönelik bir koçluk pratiği inşa etmek için birlikte çalışacağız.
                        </p>

                        <p className="text-sm text-muted-foreground">
                            İster 1:1 teklifinizi geliştiriyor, ister bir grup programı şekillendiriyor,
                            ya da sadece bir sonraki adımınızı netleştiriyor olun—burası aşırı düşünmekten
                            net eyleme geçtiğimiz yerdir.
                        </p>

                        <Button className="bg-[#408FED] hover:bg-[#408FED]/90">
                            Şimdi katıl
                        </Button>

                        {/* Event Card Preview */}
                        <div
                            className="rounded-xl p-6 text-white mt-6"
                            style={{ background: 'linear-gradient(135deg, #408FED 0%, #3E1BC9 100%)' }}
                        >
                            <Badge className="bg-white/20 text-white border-none mb-3">Sıradaki Etkinlik</Badge>
                            <h3 className="text-xl font-bold">Koçluk pratiğinizi</h3>
                            <h3 className="text-xl font-bold">güvenle</h3>
                            <h3 className="text-xl font-bold">inşa edin</h3>

                            <div className="absolute right-6 top-6">
                                <Avatar className="w-16 h-16 border-2 border-white">
                                    <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=coach" />
                                    <AvatarFallback>C</AvatarFallback>
                                </Avatar>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="space-y-2 text-sm">
                            <p className="font-medium">Koçluğun Temelleri:</p>
                            <ul className="list-disc list-inside text-muted-foreground space-y-1">
                                <li>Nişinizi ve gerçekten kime hizmet etmek istediğinizi netleştirin</li>
                                <li>Temel mesajınızı, paylaşması doğal hissettirecek şekilde geliştirin</li>
                                <li>Teklifleri güvenle nasıl yapılandıracağınızı öğrenin</li>
                            </ul>
                        </div>

                        <div className="space-y-2 text-sm">
                            <p className="font-medium">Akışınızda Ustalaşın:</p>
                            <ul className="list-disc list-inside text-muted-foreground space-y-1">
                                <li>Değerlerinizi yansıtan bir müşteri deneyimi oluşturun</li>
                                <li>Gerçek zamanlı geri bildirim ve yansıtma pratiği yapın</li>
                            </ul>
                        </div>

                        {/* Footer Actions */}
                        <div className="flex items-center gap-2 pt-4 border-t border-border">
                            <Button variant="outline" size="sm">Düzenle</Button>
                            <Button variant="outline" size="sm">Önizle</Button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
