"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Building2, Compass, ArrowRight, Check, PlayCircle, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type Role = 'instructor' | 'student';

export default function OnboardingSelectionPage() {
    const router = useRouter();
    const [selectedRole, setSelectedRole] = useState<Role>('instructor');

    const handleContinue = () => {
        if (selectedRole === 'instructor') {
            router.push('/onboarding/create-community');
        } else {
            router.push('/onboarding/student-interests');
        }
    };

    return (
        <div className="min-h-screen flex text-foreground bg-background">
            {/* LEFT SIDE: SELECTION FORM */}
            <div className="w-full lg:w-1/2 p-8 lg:p-16 flex flex-col justify-between overflow-y-auto">
                <div className="max-w-md mx-auto w-full space-y-12">
                    {/* Header */}
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#408FED] to-[#3E1BC9] flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20">
                                W
                            </div>
                            <span className="font-bold text-2xl tracking-tight">WellDo</span>
                        </div>

                        <div className="space-y-3">
                            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Merhaba! 👋</h1>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                WellDo'yu nasıl kullanmak istediğinizi seçin. Merak etmeyin, bu seçim size özel bir deneyim sunmamız için.
                            </p>
                        </div>
                    </div>

                    {/* Role Selection */}
                    <RadioGroup
                        value={selectedRole}
                        onValueChange={(val) => setSelectedRole(val as Role)}
                        className="grid gap-4"
                    >
                        {/* Instructor Option */}
                        <div className={cn(
                            "relative flex items-start space-x-4 border-2 p-6 rounded-2xl cursor-pointer transition-all duration-200",
                            selectedRole === 'instructor'
                                ? "border-primary bg-primary/5 shadow-md"
                                : "border-border hover:border-border/80 hover:bg-accent/50"
                        )}>
                            <RadioGroupItem value="instructor" id="instructor" className="mt-1" />
                            <Label htmlFor="instructor" className="grid gap-1.5 cursor-pointer font-normal flex-1">
                                <span className="font-bold text-lg flex items-center gap-2">
                                    <Building2 className={cn("w-5 h-5", selectedRole === 'instructor' ? "text-primary" : "text-muted-foreground")} />
                                    Topluluk Kurucusu
                                </span>
                                <span className="text-muted-foreground leading-snug">
                                    Kendi topluluğumu kurmak, içerik satmak ve üyelerimle etkileşime geçmek istiyorum.
                                </span>
                            </Label>
                        </div>

                        {/* Student Option */}
                        <div className={cn(
                            "relative flex items-start space-x-4 border-2 p-6 rounded-2xl cursor-pointer transition-all duration-200",
                            selectedRole === 'student'
                                ? "border-[#10B981] bg-[#10B981]/5 shadow-md"  // Green theme for students
                                : "border-border hover:border-border/80 hover:bg-accent/50"
                        )}>
                            <RadioGroupItem value="student" id="student" className="mt-1 text-[#10B981] border-[#10B981]" />
                            <Label htmlFor="student" className="grid gap-1.5 cursor-pointer font-normal flex-1">
                                <span className="font-bold text-lg flex items-center gap-2">
                                    <Compass className={cn("w-5 h-5", selectedRole === 'student' ? "text-[#10B981]" : "text-muted-foreground")} />
                                    Kaşif (Öğrenci)
                                </span>
                                <span className="text-muted-foreground leading-snug">
                                    Yeni topluluklar keşfetmek, kurslara ve etkinliklere katılmak istiyorum.
                                </span>
                            </Label>
                        </div>
                    </RadioGroup>

                    {/* Footer Actions */}
                    <div className="pt-8">
                        <Button
                            size="lg"
                            onClick={handleContinue}
                            className={cn(
                                "w-full h-14 text-lg font-semibold shadow-xl transition-all hover:scale-[1.02]",
                                selectedRole === 'instructor'
                                    ? "bg-gradient-to-r from-[#408FED] to-[#3E1BC9] hover:from-[#408FED]/90 hover:to-[#3E1BC9]/90 shadow-blue-500/25"
                                    : "bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#10B981]/90 hover:to-[#059669]/90 shadow-green-500/25"
                            )}
                        >
                            Devam Et <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE: DYNAMIC PREVIEW */}
            <div className="hidden lg:flex w-1/2 bg-[#0F172A] relative items-center justify-center p-12 overflow-hidden transition-colors duration-700">
                {/* Dynamic Background */}
                <div className={cn(
                    "absolute top-0 right-0 w-[800px] h-[800px] rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 transition-colors duration-700",
                    selectedRole === 'instructor' ? "bg-primary/20" : "bg-[#10B981]/20"
                )} />
                <div className={cn(
                    "absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 transition-colors duration-700",
                    selectedRole === 'instructor' ? "bg-blue-500/10" : "bg-green-500/10"
                )} />

                {/* Preview Cards Container */}
                <div className="relative w-full max-w-md aspect-[4/5] perspective-1000">

                    {/* INSTRUCTOR PREVIEW */}
                    <div className={cn(
                        "absolute inset-0 w-full h-full transition-all duration-500 transform",
                        selectedRole === 'instructor'
                            ? "opacity-100 rotate-y-0 scale-100"
                            : "opacity-0 rotate-y-12 scale-95 pointer-events-none"
                    )}>
                        <div className="bg-white rounded-3xl shadow-2xl p-6 h-full flex flex-col border border-white/10 relative overflow-hidden">
                            {/* Fake Dashboard Header */}
                            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
                                    <div className="space-y-2">
                                        <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
                                        <div className="h-3 w-20 bg-gray-50 rounded animate-pulse" />
                                    </div>
                                </div>
                                <div className="h-8 w-24 bg-primary/10 rounded-full animate-pulse" />
                            </div>

                            {/* Dashboard Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                                    <div className="text-blue-500 mb-2"><Users className="w-6 h-6" /></div>
                                    <div className="text-2xl font-bold text-gray-900">1,204</div>
                                    <div className="text-xs text-blue-600 font-medium">Aktif Üye</div>
                                </div>
                                <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                                    <div className="text-green-500 mb-2"><PlayCircle className="w-6 h-6" /></div>
                                    <div className="text-2xl font-bold text-gray-900">₺45.2K</div>
                                    <div className="text-xs text-green-600 font-medium">Aylık Gelir</div>
                                </div>
                            </div>

                            <div className="flex-1 bg-gray-50 rounded-2xl border border-gray-100 p-4 space-y-3">
                                <div className="h-3 w-1/3 bg-gray-200 rounded animate-pulse mb-6" />
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex gap-3 items-center">
                                        <div className="w-10 h-10 rounded-lg bg-white shadow-sm" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-3 w-3/4 bg-gray-200 rounded" />
                                            <div className="h-2 w-1/2 bg-gray-100 rounded" />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="absolute bottom-6 left-6 right-6 text-center">
                                <p className="text-sm font-medium text-gray-500">
                                    Topluluğunuzu yönetmek için güçlü bir panel.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* STUDENT PREVIEW */}
                    <div className={cn(
                        "absolute inset-0 w-full h-full transition-all duration-500 transform",
                        selectedRole === 'student'
                            ? "opacity-100 rotate-y-0 scale-100"
                            : "opacity-0 -rotate-y-12 scale-95 pointer-events-none"
                    )}>
                        <div className="bg-white rounded-3xl shadow-2xl p-6 h-full flex flex-col border border-white/10 relative overflow-hidden">
                            {/* Fake Feed Header */}
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center text-white shadow-lg shadow-green-500/20">
                                    <Compass className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Sizin İçin Önerilenler</h3>
                            </div>

                            {/* Feed Items */}
                            <div className="space-y-4">
                                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                    <div className="h-24 bg-gray-100 relative">
                                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                            <PlayCircle className="w-8 h-8 opacity-50" />
                                        </div>
                                    </div>
                                    <div className="p-3">
                                        <div className="h-4 w-3/4 bg-gray-100 rounded mb-2" />
                                        <div className="flex items-center justify-between">
                                            <div className="h-3 w-1/3 bg-gray-50 rounded" />
                                            <div className="px-2 py-1 bg-green-50 text-green-600 text-[10px] font-bold rounded-full">YENİ</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex gap-3 hover:bg-gray-50 transition-colors cursor-pointer">
                                    <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center font-bold">Y</div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-sm">Yoga Severler</h4>
                                        <p className="text-xs text-gray-500 mt-1">12.4K Üye • 3 Etkinlik</p>
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex gap-3 hover:bg-gray-50 transition-colors cursor-pointer">
                                    <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-500 flex items-center justify-center font-bold">M</div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-sm">Meditasyon & Nefes</h4>
                                        <p className="text-xs text-gray-500 mt-1">8.2K Üye • Canlı Yayın</p>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute bottom-6 left-6 right-6 text-center">
                                <p className="text-sm font-medium text-gray-500">
                                    İlgi alanlarınıza göre kişiselleştirilmiş içerikler.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
