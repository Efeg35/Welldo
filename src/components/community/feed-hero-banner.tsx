"use client";

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useState } from "react";
import { WelcomeBannerSettings } from "@/actions/community-settings";

interface WelcomeBannerProps {
    settings: WelcomeBannerSettings | null;
}

export function WelcomeBanner({ settings }: WelcomeBannerProps) {
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible || !settings) return null;

    const {
        title = "Topluluğuna Hoş Geldin",
        description = "İlk gönderini paylaşarak başla.",
        image_url,
        show_button,
        button_text = "Etkinlikleri Gör"
    } = settings;

    return (
        <div className="rounded-2xl overflow-hidden bg-white mb-8 shadow-sm relative group w-full">
            <div className="relative h-[280px] sm:h-[320px] w-full bg-gray-900 flex items-center justify-center text-center p-8 text-white transition-transform hover:scale-[1.01] duration-500">
                {/* Background Image */}
                {image_url && (
                    <img
                        src={image_url}
                        alt="Banner background"
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                )}

                {/* Modern Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

                <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
                    <h2 className="font-bold text-3xl md:text-4xl tracking-tight drop-shadow-md">{title}</h2>
                    <p className="text-white/95 text-base md:text-lg leading-relaxed font-medium drop-shadow-sm max-w-lg mx-auto">{description}</p>
                    {show_button && (
                        <div className="pt-4">
                            <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 font-semibold border-0 h-10 px-6 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95">
                                {button_text}
                            </Button>
                        </div>
                    )}
                </div>

                <button
                    onClick={() => setIsVisible(false)}
                    className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 backdrop-blur-sm rounded-full transition-all text-white/90 hover:text-white opacity-0 group-hover:opacity-100"
                    title="Panoyu gizle"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
