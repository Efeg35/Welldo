import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Compass,
    Plus,
    ChevronDown,
    MoreHorizontal,
    Video,
    MessageSquare,
    ExternalLink,
    Home,
    X
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { InstructorActions } from "@/components/dashboard/instructor-actions";

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Fetch user profile
    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    // Fetch community for instructor actions
    const { data: membership } = await supabase
        .from("memberships")
        .select("community_id, communities(slug)")
        .eq("user_id", user.id)
        .single();

    // Force onboarding if user has no community membership
    // REMOVED: Students might not have membership yet.
    // if (!membership) {
    //    redirect("/onboarding/create-community");
    // }

    const communityId = membership?.community_id || "";
    const communityData = membership?.communities as any;
    const communitySlug = Array.isArray(communityData) ? communityData[0]?.slug : communityData?.slug || "community";

    // Forcing instructor view for development/verification purposes
    const isInstructor = true; // profile?.role === 'instructor' || profile?.role === 'admin';

    return (
        <div className="flex flex-col h-full bg-background">

            <div className="flex-1 p-6 overflow-y-auto">
                <div className="max-w-4xl mx-auto space-y-8">

                    {/* Header Section */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Hoş Geldin, {profile?.full_name?.split(' ')[0]} 👋</h1>
                            <p className="text-muted-foreground">Topluluğunu yönetmek ve büyütmek için kontrol paneli.</p>
                        </div>
                        {isInstructor && (
                            <div className="flex gap-3">
                                <Button className="gap-2 bg-[#408FED] hover:bg-[#408FED]/90">
                                    <Plus className="w-4 h-4" />
                                    Yeni İçerik Oluştur
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Quick Actions Grid */}
                    {isInstructor ? (
                        <InstructorActions
                            communityId={communityId}
                            communitySlug={communitySlug}
                        />
                    ) : (
                        <div className="p-4 bg-muted/30 rounded-lg text-center text-muted-foreground text-sm border border-dashed">
                            Üye paneline hoşgeldiniz. Henüz eğitmen yetkiniz yok.
                        </div>
                    )}

                    {/* Getting Started / Onboarding Widgets */}
                    <div className="bg-card border border-border rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Compass className="w-5 h-5 text-muted-foreground" />
                                <h2 className="font-semibold text-lg">Başlarken</h2>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-4 p-3 rounded-lg bg-accent/50 border border-border/50">
                                <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">
                                    ✓
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-medium decoration-slice">Topluluk Ayarlarını Yap</h4>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer">
                                <div className="w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground/50 flex items-center justify-center text-xs text-muted-foreground">
                                    2
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-medium">İlk Alanını Oluştur</h4>
                                    <p className="text-xs text-muted-foreground">Üyelerin etkileşime gireceği bir alan yarat.</p>
                                </div>
                                <Button size="sm" variant="secondary">Yap</Button>
                            </div>
                            <div className="flex items-center gap-4 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer">
                                <div className="w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground/50 flex items-center justify-center text-xs text-muted-foreground">
                                    3
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-medium">İlk Gönderini Paylaş</h4>
                                    <p className="text-xs text-muted-foreground">Topluluğuna merhaba de.</p>
                                </div>
                                <Button size="sm" variant="secondary">Yap</Button>
                            </div>
                        </div>
                    </div>

                    {/* Feed Placeholder or Overview */}
                    <div className="text-center py-12 space-y-4">
                        <h2 className="text-2xl font-semibold">Panel Akışı</h2>
                        <p className="text-muted-foreground">Burada topluluğunla ilgili son aktiviteleri göreceksin.</p>
                        <Button variant="outline">
                            Tüm Aktiviteyi Gör
                        </Button>
                    </div>

                </div>
            </div>

            {/* Help Button */}
            <div className="fixed bottom-6 right-6">
                <Button className="rounded-full h-12 px-6 shadow-lg bg-[#408FED] hover:bg-[#408FED]/90 gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Yardım mı lazım?
                </Button>
            </div>
        </div>
    );
}
