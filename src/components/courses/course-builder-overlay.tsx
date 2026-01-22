"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, Layout, Settings, Lock, Smartphone, Users, MoreHorizontal, Workflow, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateChannelSettings } from '@/actions/community';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Course, Channel } from "@/types";

interface CourseBuilderOverlayProps {
    course: Course;
    channel: Channel;
    onClose: () => void;
}

type Tab = 'lessons' | 'customize' | 'paywalls' | 'mobile_lock' | 'members' | 'options' | 'workflows';

const tabs: { id: Tab; label: string; icon?: any }[] = [
    { id: 'lessons', label: 'Dersler' },
    { id: 'customize', label: 'Özelleştir' },
    { id: 'paywalls', label: 'Ödeme Duvarları' },
    { id: 'mobile_lock', label: 'Mobil kilit ekranı' },
    { id: 'members', label: 'Üyeler' },
    { id: 'options', label: 'Seçenekler' },
    { id: 'workflows', label: 'İş Akışları' },
];

export function CourseBuilderOverlay({ course, channel, onClose }: CourseBuilderOverlayProps) {
    const [activeTab, setActiveTab] = useState<Tab>('lessons');
    const [isCourseTypeModalOpen, setIsCourseTypeModalOpen] = useState(false);
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
    const [selectedCourseType, setSelectedCourseType] = useState((channel.settings as any)?.course_type || 'self-paced');
    const [isSavingType, setIsSavingType] = useState(false);

    const handleSaveCourseType = async () => {
        setIsSavingType(true);
        try {
            await updateChannelSettings(channel.id, { course_type: selectedCourseType });
            toast.success("Kurs türü güncellendi");
            setIsCourseTypeModalOpen(false);
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("Kurs türü güncellenemedi");
        } finally {
            setIsSavingType(false);
        }
    };
    const router = useRouter();

    // Prevent body scroll when open
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "unset";
        };
    }, []);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed inset-0 z-50 bg-white flex flex-col"
            >
                {/* Header */}
                <div className="h-16 border-b flex items-center justify-between px-4 bg-white shrink-0">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-gray-100">
                            <X className="w-5 h-5 text-gray-500" />
                        </Button>
                        <h2 className="font-bold text-lg hidden md:block">{channel.name}</h2>
                    </div>

                    {/* Tabs */}
                    <div className="flex-1 flex justify-center overflow-x-auto no-scrollbar mx-4">
                        <div className="flex items-center space-x-1">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "px-4 py-2 text-sm font-medium rounded-full transition-colors whitespace-nowrap",
                                        activeTab === tab.id
                                            ? "bg-gray-100 text-gray-900"
                                            : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                    )}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="w-[100px] flex justify-end">
                        {/* Placeholder for Save/Publish if needed */}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6 md:p-10">
                    <div className="max-w-5xl mx-auto h-full">
                        {activeTab === 'lessons' && (
                            <div className="flex flex-col h-full">
                                <div className="mb-8">
                                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Dersler</h1>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Layout className="w-4 h-4" />
                                        <span className="font-medium">Kurs türü:</span>
                                        <span
                                            className="border-b border-dotted border-gray-400 font-semibold text-gray-900 cursor-pointer hover:text-blue-600 hover:border-blue-600 transition-colors"
                                            onClick={() => {
                                                setSelectedCourseType((channel.settings as any)?.course_type || 'self-paced');
                                                setIsCourseTypeModalOpen(true);
                                            }}
                                        >
                                            {(channel.settings as any)?.course_type === 'structured' ? 'Yapılandırılmış' :
                                                (channel.settings as any)?.course_type === 'scheduled' ? 'Zamanlanmış' :
                                                    'Kendi Hızında'}
                                        </span>
                                    </div>
                                </div>

                                <Dialog open={isCourseTypeModalOpen} onOpenChange={setIsCourseTypeModalOpen}>
                                    <DialogContent className="sm:max-w-2xl">
                                        <DialogHeader>
                                            <DialogTitle>Kurs türü</DialogTitle>
                                        </DialogHeader>

                                        <div className="flex flex-col gap-4 py-4">
                                            {/* Self-paced */}
                                            <div
                                                className={cn(
                                                    "border rounded-lg p-4 cursor-pointer transition-all flex items-start justify-between group",
                                                    selectedCourseType === 'self-paced'
                                                        ? "border-gray-900 ring-1 ring-gray-900 bg-gray-50/50"
                                                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                                )}
                                                onClick={() => setSelectedCourseType('self-paced')}
                                            >
                                                <div className="space-y-1">
                                                    <div className="font-semibold text-gray-900">Kendi Hızında</div>
                                                    <div className="text-sm text-gray-500">
                                                        Kurs, üye kaydolduğunda başlar. Tüm içerik hemen erişilebilir olur.
                                                    </div>
                                                </div>
                                                {selectedCourseType === 'self-paced' && (
                                                    <CheckCircle2 className="w-5 h-5 text-gray-900 shrink-0" />
                                                )}
                                            </div>

                                            {/* Structured */}
                                            <div
                                                className={cn(
                                                    "border rounded-lg p-4 cursor-pointer transition-all flex items-start justify-between group",
                                                    selectedCourseType === 'structured'
                                                        ? "border-gray-900 ring-1 ring-gray-900 bg-gray-50/50"
                                                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                                )}
                                                onClick={() => setSelectedCourseType('structured')}
                                            >
                                                <div className="space-y-1">
                                                    <div className="font-semibold text-gray-900">Yapılandırılmış</div>
                                                    <div className="text-sm text-gray-500">
                                                        Kurs, üye kaydolduğunda başlar. Bölümler kayıt tarihine göre kademeli olarak açılır.
                                                    </div>
                                                </div>
                                                {selectedCourseType === 'structured' && (
                                                    <CheckCircle2 className="w-5 h-5 text-gray-900 shrink-0" />
                                                )}
                                            </div>

                                            {/* Scheduled */}
                                            <div
                                                className={cn(
                                                    "border rounded-lg p-4 cursor-pointer transition-all flex items-start justify-between group",
                                                    selectedCourseType === 'scheduled'
                                                        ? "border-gray-900 ring-1 ring-gray-900 bg-gray-50/50"
                                                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                                )}
                                                onClick={() => setSelectedCourseType('scheduled')}
                                            >
                                                <div className="space-y-1">
                                                    <div className="font-semibold text-gray-900">Zamanlanmış</div>
                                                    <div className="text-sm text-gray-500">
                                                        Kurs belirli bir tarihte başlar. Bölümler bu tarihe göre kademeli olarak açılır.
                                                    </div>
                                                </div>
                                                {selectedCourseType === 'scheduled' && (
                                                    <CheckCircle2 className="w-5 h-5 text-gray-900 shrink-0" />
                                                )}
                                            </div>
                                        </div>

                                        <DialogFooter className="gap-2 sm:gap-0">
                                            <Button variant="outline" onClick={() => setIsCourseTypeModalOpen(false)}>
                                                İptal
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    const currentType = (channel.settings as any)?.course_type || 'self-paced';
                                                    if (selectedCourseType !== currentType) {
                                                        setIsConfirmationOpen(true);
                                                    } else {
                                                        handleSaveCourseType();
                                                    }
                                                }}
                                                disabled={isSavingType}
                                                className="bg-gray-900 text-white hover:bg-gray-800"
                                            >
                                                {isSavingType ? 'Kaydediliyor...' : 'Kaydet'}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>

                                {/* Confirmation Modal */}
                                <Dialog open={isConfirmationOpen} onOpenChange={setIsConfirmationOpen}>
                                    <DialogContent className="sm:max-w-md">
                                        <DialogHeader>
                                            <DialogTitle>Kurs türünü değiştirmek istediğinize emin misiniz?</DialogTitle>
                                        </DialogHeader>

                                        <div className="py-4 text-gray-500">
                                            {selectedCourseType === 'self-paced' && (
                                                <p>Bu kursu 'Kendi Hızında' olarak değiştirdiğinizde, tüm bölümler bu kurs alanındaki üyelere hemen erişilebilir olacaktır.</p>
                                            )}
                                            {selectedCourseType === 'structured' && (
                                                <p>Bu kursu 'Yapılandırılmış' olarak değiştirdiğinizde, kurs müfredatını gözden geçirebilir ve hemen yayınlamak istemediğiniz bölümler için yayınlama gecikmeleri ayarlayabilirsiniz.</p>
                                            )}
                                            {selectedCourseType === 'scheduled' && (
                                                <p>Bu kursu 'Zamanlanmış' olarak değiştirdiğinizde, kurs müfredatını gözden geçirebilir ve hemen yayınlamak istemediğiniz bölümler için yayınlama tarihleri planlayabilirsiniz.</p>
                                            )}
                                        </div>

                                        <DialogFooter className="gap-2 sm:gap-0">
                                            <Button variant="outline" onClick={() => setIsConfirmationOpen(false)}>
                                                İptal
                                            </Button>
                                            <Button onClick={() => { setIsConfirmationOpen(false); handleSaveCourseType(); }} disabled={isSavingType} className="bg-gray-900 text-white hover:bg-gray-800">
                                                Kaydet
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>

                                <div className="flex-1 flex items-start justify-center pt-4">
                                    <div className="bg-white p-16 rounded-xl border border-gray-200 shadow-sm max-w-5xl w-full text-center">
                                        <h3 className="text-2xl font-bold text-gray-900 mb-4">Kurs içeriğinizi oluşturun</h3>
                                        <p className="text-gray-500 mb-8 max-w-lg mx-auto">
                                            Bir kurs bölümü ekleyerek başlayın ve ardından dersleri ekleyin.
                                        </p>
                                        <Button size="lg" className="rounded-full bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 shadow-sm px-8">
                                            + Bölüm ekle
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab !== 'lessons' && (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                bu sekme yapım aşamasında: {tabs.find(t => t.id === activeTab)?.label}
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
