"use client";

import { Button } from "@/components/ui/button";

export function MembersEmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
            <h3 className="text-2xl font-bold tracking-tight text-gray-900 mb-3">
                Henüz üye yok
            </h3>
            <p className="text-gray-500 max-w-lg mb-8 text-lg leading-relaxed">
                Topluluğun büyümeye hazır. Başkalarını katılmaya davet et ve alanında bağlantılar kurmaya başla.
            </p>
            <Button
                size="lg"
                className="bg-gray-900 hover:bg-black text-white rounded-full px-8 h-12 font-medium"
            >
                Üye ekle
            </Button>
        </div>
    );
}
