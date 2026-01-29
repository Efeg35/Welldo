"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface CoverPhotoProps {
    imageUrl: string | null;
}

export function CoverPhoto({ imageUrl }: CoverPhotoProps) {
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible || !imageUrl) return null;

    return (
        <div className="relative w-full h-[200px] sm:h-[280px] group rounded-2xl overflow-hidden shadow-sm">
            <img
                src={imageUrl}
                alt="Cover"
                className="w-full h-full object-cover"
            />

            {/* Hide button - only visible on hover */}
            <button
                onClick={() => setIsVisible(false)}
                className="absolute top-3 right-3 p-2 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full transition-all text-white opacity-0 group-hover:opacity-100"
                title="Kapağı gizle"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}
