"use client";

import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { X, Calendar } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Event } from "@/types";
import { Button } from "@/components/ui/button";

interface RegistrationSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: Event | null;
}

export function RegistrationSuccessModal({ isOpen, onClose, event }: RegistrationSuccessModalProps) {
    if (!event) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl bg-white">
                <VisuallyHidden>
                    <DialogTitle>Etkinlik Kaydı Başarılı</DialogTitle>
                </VisuallyHidden>
                <div className="p-8 flex flex-col items-center text-center space-y-6 relative">
                    <div className="text-5xl mt-4">👏</div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Kayıt olduğunuz için teşekkürler!</h2>
                        <h3 className="text-xl font-semibold text-gray-700">{event.title}</h3>
                    </div>

                    <div className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-center gap-3 justify-center">
                        <Calendar className="w-5 h-5 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">
                            {format(new Date(event.start_time), "d MMMM, HH:mm", { locale: tr })} - {format(new Date(event.end_time), "HH:mm")}
                        </span>
                    </div>

                    <p className="text-[15px] text-gray-500 leading-relaxed px-4">
                        Herhangi bir değişiklikten haberdar olmanız için size takvim daveti içeren bir e-posta göndereceğiz.
                    </p>

                    <Button
                        onClick={onClose}
                        className="w-full bg-gray-900 hover:bg-black text-white rounded-xl h-12 font-semibold text-base transition-all mt-4"
                    >
                        Kapat
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
