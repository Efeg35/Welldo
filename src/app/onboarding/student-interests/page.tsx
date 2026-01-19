"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, Check, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { completeStudentOnboarding } from "@/actions/onboarding";

const INTERESTS = [
    { id: "yoga", label: "🧘‍♀️ Yoga", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
    { id: "pilates", label: "🤸‍♀️ Pilates", color: "bg-pink-500/20 text-pink-400 border-pink-500/30" },
    { id: "meditation", label: "🧘‍♂️ Meditasyon", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
    { id: "nutrition", label: "🥗 Beslenme", color: "bg-green-500/20 text-green-400 border-green-500/30" },
    { id: "fitness", label: "💪 Fitness", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    { id: "running", label: "🏃‍♂️ Koşu", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
    { id: "mental_health", label: "🧠 Mental Sağlık", color: "bg-teal-500/20 text-teal-400 border-teal-500/30" },
    { id: "breathwork", label: "🌬️ Nefes Çalışması", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
    { id: "calisthenics", label: "🏋️ Kalistenik", color: "bg-red-500/20 text-red-400 border-red-500/30" },
    { id: "dance", label: "💃 Dans", color: "bg-rose-500/20 text-rose-400 border-rose-500/30" },
];

export default function StudentInterestsPage() {
    const router = useRouter();
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const toggleInterest = (id: string) => {
        if (selectedInterests.includes(id)) {
            setSelectedInterests(selectedInterests.filter((i) => i !== id));
        } else {
            setSelectedInterests([...selectedInterests, id]);
        }
    };

    const handleComplete = async () => {
        setIsLoading(true);
        try {
            const result = await completeStudentOnboarding({ interests: selectedInterests });
            if (result.success) {
                toast.success("Profilin oluşturuldu! Keşfetmeye başlıyoruz...");
                router.push("/community"); // Or feed page
            } else {
                toast.error("Bir hata oluştu. Lütfen tekrar dene.");
            }
        } catch (error) {
            toast.error("Beklenmedik bir hata oluştu.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
            <div className="max-w-3xl w-full space-y-12">
                <div className="space-y-4">
                    <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
                        Nelerle İlgileniyorsun?
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Sana en uygun toplulukları ve etkinlikleri önerebilmemiz için ilgi alanlarını seç.
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {INTERESTS.map((interest) => {
                        const isSelected = selectedInterests.includes(interest.id);
                        return (
                            <button
                                key={interest.id}
                                onClick={() => toggleInterest(interest.id)}
                                className={cn(
                                    "relative p-4 rounded-2xl border transition-all duration-200 group hover:scale-105",
                                    isSelected
                                        ? cn("ring-2 ring-offset-2 ring-offset-background", interest.color, "border-transparent")
                                        : "bg-card border-border hover:border-white/20"
                                )}
                            >
                                <div className="text-lg font-medium mb-1">{interest.label.split(' ')[0]}</div>
                                <div className="text-sm font-medium">{interest.label.split(' ').slice(1).join(' ')}</div>

                                {isSelected && (
                                    <div className="absolute top-2 right-2 w-5 h-5 bg-white text-black rounded-full flex items-center justify-center shadow-sm">
                                        <Check className="w-3 h-3" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="pt-8">
                    <Button
                        onClick={handleComplete}
                        disabled={isLoading || selectedInterests.length === 0}
                        size="lg"
                        className="w-full md:w-auto min-w-[200px] h-14 rounded-full text-lg gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Profilin Hazırlanıyor...
                            </>
                        ) : (
                            <>
                                Keşfetmeye Başla <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </Button>
                    {selectedInterests.length === 0 && (
                        <p className="text-sm text-muted-foreground mt-4">
                            Devam etmek için en az bir ilgi alanı seçmelisin.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
