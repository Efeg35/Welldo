"use client";

import { Lock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Channel } from "@/types";
import Link from "next/link";

interface SpaceLockScreenProps {
    channel: Channel;
}

export function SpaceLockScreen({ channel }: SpaceLockScreenProps) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white min-h-[60vh] text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-6">
                <Lock className="w-8 h-8 text-gray-400" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">Bu alan kilitli</h1>
            <p className="text-gray-500 max-w-md mb-8">
                <strong>{channel.name}</strong> alanına erişmek için yetkiniz bulunmuyor.
                Bu alan sadece belirli üyelere veya ödeme yapan kullanıcılara açıktır.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" asChild>
                    <Link href="/dashboard">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Geri Dön
                    </Link>
                </Button>

                {/* 
                  If we had a way to request access or buy, we'd put it here.
                  For courses, this screen is usually not shown because CourseFeed has its own internal lock.
                */}
            </div>
        </div>
    );
}
