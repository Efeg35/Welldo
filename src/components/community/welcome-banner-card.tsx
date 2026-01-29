"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, MoreHorizontal } from "lucide-react";
import { WelcomeBannerSettings } from "@/actions/community-settings";

interface WelcomeBannerCardProps {
    settings: WelcomeBannerSettings | null;
}

export function WelcomeBannerCard({ settings }: WelcomeBannerCardProps) {
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible || !settings || !settings.image_url) return null;

    const {
        title = "Topluluğuna Hoş Geldin",
        description = "İlk gönderini paylaşarak başla.",
        image_url,
        show_button,
        button_text = "Etkinlikleri Gör"
    } = settings;

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm relative group mb-4">
            {/* Image Section */}
            {image_url && (
                <div className="relative w-full aspect-[16/9] max-h-[400px]">
                    <img
                        src={image_url}
                        alt="Welcome"
                        className="w-full h-full object-cover"
                    />
                </div>
            )}

            {/* Content Section */}
            <div className="p-5">
                <h2 className="font-bold text-xl text-gray-900 mb-1">{title}</h2>
                <p className="text-gray-600 text-base">{description}</p>

                {show_button && (
                    <div className="mt-4">
                        <Button
                            variant="outline"
                            className="rounded-full border-gray-300 hover:bg-gray-50 font-medium"
                        >
                            {button_text}
                        </Button>
                    </div>
                )}
            </div>

            {/* More options menu */}
            <button className="absolute top-3 right-3 p-2 bg-white/80 hover:bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="w-4 h-4 text-gray-600" />
            </button>

            {/* Hide button */}
            <button
                onClick={() => setIsVisible(false)}
                className="absolute top-3 right-12 p-2 bg-white/80 hover:bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                title="Gizle"
            >
                <X className="w-4 h-4 text-gray-600" />
            </button>
        </div>
    );
}
