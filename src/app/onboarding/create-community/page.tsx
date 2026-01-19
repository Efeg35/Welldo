"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { completeInstructorOnboarding } from "@/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Check, ChevronRight, Loader2, Sparkles, Building2, Target, DollarSign, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Step = 'identity' | 'goals' | 'profile' | 'features';

interface FormData {
    name: string;
    slug: string;
    goal: string;
    revenue: string;
    features: {
        discussions: boolean;
        events: boolean;
        chat: boolean;
        courses: boolean;
        gamification: boolean;
        memberships: boolean;
    };
}

export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>('identity');
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        name: "",
        slug: "",
        goal: "",
        revenue: "",
        features: {
            discussions: true,
            events: true,
            chat: true,
            courses: false,
            gamification: true,
            memberships: false
        }
    });

    // Auto-generate slug from name
    useEffect(() => {
        if (step === 'identity' && formData.name) {
            const slug = formData.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)+/g, '');
            setFormData(prev => ({ ...prev, slug }));
        }
    }, [formData.name, step]);

    const handleNext = () => {
        const steps: Step[] = ['identity', 'goals', 'profile', 'features'];
        const currentIndex = steps.indexOf(step);
        if (currentIndex < steps.length - 1) {
            setStep(steps[currentIndex + 1]);
        }
    };

    const handleBack = () => {
        const steps: Step[] = ['identity', 'goals', 'profile', 'features'];
        const currentIndex = steps.indexOf(step);
        if (currentIndex > 0) {
            setStep(steps[currentIndex - 1]);
        }
    };

    const handleComplete = async () => {
        setIsLoading(true);
        try {
            const result = await completeInstructorOnboarding({
                communityName: formData.name,
                communitySlug: formData.slug,
                enabledFeatures: formData.features,
                goal: formData.goal,
                revenue: formData.revenue
            });

            if (result.success) {
                toast.success("Topluluğunuz hazır! 🚀");
                router.push(`/dashboard`); // Redirect to dashboard as requested
            } else {
                toast.error("Bir hata oluştu.");
            }
        } catch (error: any) {
            console.error("Frontend HandleComplete Error:", error);
            toast.error("Beklenmedik bir hata: " + (error.message || "Bilinmiyor"));
        } finally {
            setIsLoading(false);
        }
    };

    const steps = [
        { id: 'identity', label: 'Kimlik', icon: Building2 },
        { id: 'goals', label: 'Hedefler', icon: Target },
        { id: 'profile', label: 'Profil', icon: DollarSign },
        { id: 'features', label: 'Özellikler', icon: LayoutGrid },
    ];

    const currentStepIndex = steps.findIndex(s => s.id === step);
    const progress = ((currentStepIndex + 1) / steps.length) * 100;

    return (
        <div className="min-h-screen flex text-foreground bg-background">
            {/* LEFT SIDE: FORM */}
            <div className="w-full lg:w-1/2 p-8 lg:p-16 flex flex-col justify-between overflow-y-auto">
                <div className="max-w-md mx-auto w-full space-y-8">
                    {/* Header */}
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#408FED] to-[#3E1BC9] flex items-center justify-center text-white font-bold">
                                W
                            </div>
                            <span className="font-bold text-xl">WellDo</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-secondary h-1.5 rounded-full mb-8">
                            <div
                                className="bg-primary h-1.5 rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-6 min-h-[400px]">
                        {step === 'identity' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
                                <div>
                                    <h1 className="text-3xl font-bold mb-2">Topluluğunuzu kuralım</h1>
                                    <p className="text-muted-foreground">Merak etmeyin, bu bilgileri daha sonra değiştirebilirsiniz.</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Topluluk Adı</Label>
                                        <Input
                                            id="name"
                                            placeholder="Örn: Yoga Eğitmenleri Türkiye"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="h-12 text-lg"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="slug">Topluluk URL</Label>
                                        <div className="flex items-center">
                                            <span className="bg-muted px-3 py-3 border border-r-0 border-input rounded-l-md text-muted-foreground">
                                                welldo.com/community/
                                            </span>
                                            <Input
                                                id="slug"
                                                value={formData.slug}
                                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                                className="rounded-l-none h-12"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 'goals' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
                                <div>
                                    <h1 className="text-3xl font-bold mb-2">Amacınız nedir?</h1>
                                    <p className="text-muted-foreground">Size en uygun deneyimi sunmamız için bize yardımcı olun.</p>
                                </div>

                                <RadioGroup
                                    value={formData.goal}
                                    onValueChange={(val) => setFormData({ ...formData, goal: val })}
                                    className="space-y-3"
                                >
                                    {[
                                        "Yeni bir topluluk kurmak istiyorum",
                                        "Mevcut topluluğumu taşımak istiyorum",
                                        "Sadece keşfediyorum"
                                    ].map((option) => (
                                        <div key={option} className="flex items-center space-x-2 border border-input p-4 rounded-xl hover:bg-accent cursor-pointer transition-colors [&:has(:checked)]:border-primary [&:has(:checked)]:bg-accent/50">
                                            <RadioGroupItem value={option} id={option} />
                                            <Label htmlFor={option} className="flex-1 cursor-pointer font-medium">{option}</Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </div>
                        )}

                        {step === 'profile' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
                                <div>
                                    <h1 className="text-3xl font-bold mb-2">Şirket büyüklüğünüz?</h1>
                                    <p className="text-muted-foreground">Bu bilgi profilinizde gösterilecektir (opsiyonel).</p>
                                </div>

                                <RadioGroup
                                    value={formData.revenue}
                                    onValueChange={(val) => setFormData({ ...formData, revenue: val })}
                                    className="space-y-3"
                                >
                                    {[
                                        "Henüz gelirim yok",
                                        "0 - 5.000 TL / ay",
                                        "5.000 - 50.000 TL / ay",
                                        "50.000 TL+ / ay"
                                    ].map((option) => (
                                        <div key={option} className="flex items-center space-x-2 border border-input p-4 rounded-xl hover:bg-accent cursor-pointer transition-colors [&:has(:checked)]:border-primary [&:has(:checked)]:bg-accent/50">
                                            <RadioGroupItem value={option} id={option} />
                                            <Label htmlFor={option} className="flex-1 cursor-pointer font-medium">{option}</Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </div>
                        )}

                        {step === 'features' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
                                <div>
                                    <h1 className="text-3xl font-bold mb-2">Neler olsun?</h1>
                                    <p className="text-muted-foreground">Topluluğunuzda bulunmasını istediğiniz özellikleri seçin.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[
                                        { id: 'discussions', label: 'Tartışmalar', desc: 'Forum benzeri konu başlıkları' },
                                        { id: 'events', label: 'Etkinlikler', desc: 'Online/Fiziksel buluşmalar' },
                                        { id: 'chat', label: 'Sohbet', desc: 'Gerçek zamanlı mesajlaşma' },
                                        { id: 'courses', label: 'Kurslar', desc: 'Eğitim içerikleri ve müfredat' },
                                        { id: 'gamification', label: 'Oyunlaştırma', desc: 'Puanlar ve rozetler' },
                                        { id: 'memberships', label: 'Üyelikler', desc: 'Ücretli abonelik sistemi' },
                                    ].map((feat) => (
                                        <div key={feat.id} className="relative flex items-start space-x-3 border border-input p-4 rounded-xl hover:bg-accent cursor-pointer transition-all [&:has(:checked)]:border-primary [&:has(:checked)]:shadow-sm">
                                            <Checkbox
                                                id={feat.id}
                                                checked={formData.features[feat.id as keyof typeof formData.features]}
                                                onCheckedChange={(checked) =>
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        features: { ...prev.features, [feat.id]: !!checked }
                                                    }))
                                                }
                                                className="mt-1"
                                            />
                                            <div className="grid gap-1.5 leading-none">
                                                <Label htmlFor={feat.id} className="font-semibold cursor-pointer">
                                                    {feat.label}
                                                </Label>
                                                <p className="text-xs text-muted-foreground">
                                                    {feat.desc}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-8 bg-gray-50 border border-gray-100 rounded-xl p-6 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <Sparkles className="w-24 h-24 text-primary" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="text-xs font-bold text-primary uppercase tracking-wider mb-2">BAŞLANGIÇ PLANI</div>
                                        <div className="flex items-baseline gap-1 mb-2">
                                            <span className="text-3xl font-bold text-gray-900">0 TL</span>
                                            <span className="text-gray-500">/ ay</span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-4">%15 Platform komisyonu. İstediğiniz zaman iptal edebilirsiniz.</p>
                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                            <Check className="w-3 h-3" /> Kredi kartı gerekmez
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-6 border-t border-border">
                        <Button
                            variant="ghost"
                            onClick={handleBack}
                            disabled={step === 'identity'}
                            className={`${step === 'identity' ? 'invisible' : ''}`}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Geri
                        </Button>

                        {step === 'features' ? (
                            <Button
                                size="lg"
                                onClick={handleComplete}
                                disabled={isLoading}
                                className="bg-gradient-to-r from-[#408FED] to-[#3E1BC9] text-white hover:opacity-90 transition-opacity min-w-[140px]"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                    <>
                                        Ücretsiz Başla 🚀
                                    </>
                                )}
                            </Button>
                        ) : (
                            <Button size="lg" onClick={handleNext} disabled={!formData.name && step === 'identity'} className="min-w-[120px]">
                                Devam Et
                                <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE: PREVIEW */}
            <div className="hidden lg:flex w-1/2 bg-[#0F172A] relative items-center justify-center p-12 overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3" />

                {/* Preview Card */}
                <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 relative z-10 animate-in fade-in zoom-in-95 duration-700">
                    <div className="absolute top-8 right-8">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                    </div>

                    <div className="space-y-8">
                        <div>
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">TOPLULUK PROFİLİ</div>
                            <h2 className="text-3xl font-bold text-gray-900 break-words">
                                {formData.name || "Topluluk İsmi"}
                            </h2>
                        </div>

                        <div>
                            <div className="text-xs font-semibold text-primary mb-1">URL</div>
                            <p className="text-sm text-gray-600 font-mono bg-gray-50 p-2 rounded border border-gray-100 truncate">
                                welldo.com/community/{formData.slug || "url-adresi"}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <div className="text-xs font-semibold text-primary mb-1">HEDEF</div>
                                <p className="text-sm text-gray-600">
                                    {formData.goal ? (formData.goal.length > 25 ? formData.goal.substring(0, 25) + "..." : formData.goal) : "Henüz seçilmedi"}
                                </p>
                            </div>
                            <div>
                                <div className="text-xs font-semibold text-primary mb-1">GELİR</div>
                                <p className="text-sm text-gray-600">
                                    {formData.revenue || "Belirtilmedi"}
                                </p>
                            </div>
                        </div>

                        {/* Building Blocks */}
                        <div>
                            <div className="text-xs font-semibold text-primary mb-3">AKTİF ÖZELLİKLER</div>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(formData.features).filter(([, active]) => active).map(([key]) => (
                                    <span key={key} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100 capitalize">
                                        {key}
                                    </span>
                                ))}
                                {Object.values(formData.features).every(v => !v) && (
                                    <span className="text-sm text-gray-400 italic">Henüz özellik seçilmedi</span>
                                )}
                            </div>
                        </div>

                        {/* Footer / User */}
                        <div className="pt-6 mt-6 border-t border-gray-100 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold">
                                UK
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900">Yönetici Hesabı</p>
                                <p className="text-xs text-gray-500">Bu topluluğun sahibi sizsiniz</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
