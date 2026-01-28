"use client";

import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

interface MembersEmptyStateProps {
    onAddMember?: () => void;
}

export function MembersEmptyState({ onAddMember }: MembersEmptyStateProps) {
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
                className="bg-gray-900 hover:bg-black text-white rounded-full px-8 h-12 font-medium gap-2"
                onClick={onAddMember}
            >
                <UserPlus className="w-4 h-4" />
                Üye ekle
            </Button>
        </div>
    );
}
