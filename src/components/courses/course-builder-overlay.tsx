"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, Layout, Settings, Lock, Smartphone, Users, MoreHorizontal, Workflow, CheckCircle2, HelpCircle, Eye, EyeOff, Globe, Image as ImageIcon, Plus, Info } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { updateChannelSettings, updateChannel } from '@/actions/community';
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
import {
    createModule, updateModule, deleteModule,
    createLesson, updateLesson, deleteLesson,
    reorderModules, reorderLessons,
    updateCourse
} from "@/actions/courses";
import { Input } from "@/components/ui/input";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import {
    RadioGroup,
    RadioGroupItem
} from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { LessonEditor } from "./lesson-editor";
import { CustomizeTab } from "./customize-tab";
import { CoursePaywallTab } from "./course-paywall-tab";
import { createClient as createBrowserClient } from "@/lib/supabase/client";

interface CourseBuilderOverlayProps {
    course: Course;
    channel: Channel;
    onClose: () => void;
}

// Sortable Item Components
interface SortableItemProps {
    id: string;
    children: (listeners: any) => React.ReactNode;
}

function SortableModuleItem({ id, children }: SortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: id, data: { type: 'module' } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 999 : 'auto',
        position: 'relative' as 'relative',
        touchAction: 'none' // Important for pointer events
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            {children(listeners)}
        </div>
    );
}

function SortableLessonItem({ id, children }: SortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: id, data: { type: 'lesson' } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 999 : 'auto',
        position: 'relative' as 'relative',
        touchAction: 'none'
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            {children(listeners)}
        </div>
    );
}

type Tab = 'lessons' | 'customize' | 'paywalls' | 'members' | 'options';

const tabs: { id: Tab; label: string; icon?: any }[] = [
    { id: 'lessons', label: 'Dersler' },
    { id: 'customize', label: 'Özelleştir' },
    { id: 'paywalls', label: 'Ödeme Duvarları' },
    { id: 'members', label: 'Üyeler' },
    { id: 'options', label: 'Seçenekler' },
];


export function CourseBuilderOverlay({ course, channel, onClose }: CourseBuilderOverlayProps) {
    const [activeTab, setActiveTab] = useState<Tab>('lessons');
    const [isCourseTypeModalOpen, setIsCourseTypeModalOpen] = useState(false);
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
    const [selectedCourseType, setSelectedCourseType] = useState((channel.settings as any)?.course_type || 'self-paced');
    const [isSavingType, setIsSavingType] = useState(false);

    // Module/Section State
    const [modules, setModules] = useState(course.modules || []);
    const [isAddingSection, setIsAddingSection] = useState(false);
    const [newSectionTitle, setNewSectionTitle] = useState("");
    const [isCreatingSection, setIsCreatingSection] = useState(false);
    const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
    const [editSectionTitle, setEditSectionTitle] = useState("");

    // Lesson State
    const [addingLessonToModuleId, setAddingLessonToModuleId] = useState<string | null>(null);
    const [newLessonTitle, setNewLessonTitle] = useState("");
    const [isCreatingLesson, setIsCreatingLesson] = useState(false);
    const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
    const [editLessonTitle, setEditLessonTitle] = useState("");
    const [editingLesson, setEditingLesson] = useState<any | null>(null); // CourseLesson type import issues bypassing for now

    const courseType = (channel.settings as any)?.course_type || 'self-paced';

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Require 8px movement to start drag (allows buttons to be clicked)
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const router = useRouter();

    // Prevent body scroll when open
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "unset";
        };
    }, []);

    useEffect(() => {
        setModules(course.modules || []);
    }, [course.modules]);

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        const activeData = active.data.current;
        const overData = over.data.current;

        // Reordering Modules
        if (activeData?.type === 'module' && overData?.type === 'module') {
            const oldIndex = modules.findIndex(m => m.id === active.id);
            const newIndex = modules.findIndex(m => m.id === over.id);

            const newModules = arrayMove(modules, oldIndex, newIndex);

            // Optimistic update
            setModules(newModules);

            // Create update payload
            const updates = newModules.map((m, index) => ({
                id: m.id,
                order: index + 1
            }));

            try {
                await reorderModules(updates);
            } catch (error) {
                console.error("Failed to reorder modules", error);
                toast.error("Sıralama güncellenemedi");
            }
        }

        // Reordering Lessons
        if (activeData?.type === 'lesson') {
            // Find module for active lesson
            const sourceModule = modules.find(m => m.lessons?.some(l => l.id === active.id));
            if (!sourceModule) return;

            const oldIndex = sourceModule.lessons?.findIndex(l => l.id === active.id) ?? -1;

            // Check if dropped over another lesson
            let targetModule = sourceModule;
            let newIndex = -1;

            if (overData?.type === 'lesson') {
                targetModule = modules.find(m => m.lessons?.some(l => l.id === over.id)) || sourceModule;
                newIndex = targetModule.lessons?.findIndex(l => l.id === over.id) ?? -1;
            }

            // Only handle same module reordering for now for safety
            if (sourceModule.id === targetModule.id && oldIndex !== -1 && newIndex !== -1) {
                const newLessons = arrayMove(sourceModule.lessons || [], oldIndex, newIndex);

                const updatedModules = modules.map(m => {
                    if (m.id === sourceModule.id) {
                        return { ...m, lessons: newLessons };
                    }
                    return m;
                });

                setModules(updatedModules);

                const updates = newLessons.map((l, index) => ({
                    id: l.id,
                    order: index + 1
                }));

                try {
                    await reorderLessons(updates);
                } catch (error) {
                    console.error(error);
                    toast.error("Ders sıralaması güncellenemedi");
                }
            }
        }
    };

    // If editing a lesson, show the full-screen Lesson Editor
    if (editingLesson) {
        return (
            <AnimatePresence>
                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed inset-0 z-50 bg-white"
                >
                    <LessonEditor
                        lesson={editingLesson}
                        onBack={() => setEditingLesson(null)}
                        onUpdate={(updatedLesson) => {
                            // Update local state
                            const newModules = modules.map(m => ({
                                ...m,
                                lessons: m.lessons?.map(l => l.id === updatedLesson.id ? updatedLesson : l)
                            }));
                            setModules(newModules);
                            // Also update the specific module logic if needed, but setModules handles the overlay state
                        }}
                    />
                </motion.div>
            </AnimatePresence>
        );
    }




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

    const handleUpdateLesson = async (lessonId: string, moduleId: string, updates: any) => {
        try {
            await updateLesson(lessonId, updates);
            // Optimistic update
            setModules(modules.map(m => {
                if (m.id === moduleId && m.lessons) {
                    return {
                        ...m,
                        lessons: m.lessons.map(l => l.id === lessonId ? { ...l, ...updates } : l)
                    };
                }
                return m;
            }));
            toast.success("Ders güncellendi");
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("Ders güncellenemedi");
        }
    };

    const handleDeleteLesson = async (lessonId: string, moduleId: string) => {
        if (!confirm("Bu dersi silmek istediğinize emin misiniz?")) return;

        try {
            await deleteLesson(lessonId);
            // Optimistic update
            setModules(modules.map(m => {
                if (m.id === moduleId && m.lessons) {
                    return {
                        ...m,
                        lessons: m.lessons.filter(l => l.id !== lessonId)
                    };
                }
                return m;
            }));
            toast.success("Ders silindi");
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("Ders silinemedi");
        }
    };

    const handleCreateLesson = async (moduleId: string) => {
        if (!newLessonTitle.trim()) return;

        setIsCreatingLesson(true);
        try {
            const newLesson = await createLesson(moduleId, newLessonTitle);

            // Optimistic update
            const updatedModules = modules.map(m => {
                if (m.id === moduleId) {
                    return { ...m, lessons: [...(m.lessons || []), newLesson] };
                }
                return m;
            });
            setModules(updatedModules);

            setNewLessonTitle("");
            setAddingLessonToModuleId(null);
            toast.success("Ders oluşturuldu");
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("Ders oluşturulamadı");
        } finally {
            setIsCreatingLesson(false);
        }
    };

    const handleAddSection = async () => {
        if (!newSectionTitle.trim()) return;

        setIsCreatingSection(true);
        try {
            const newModule = await createModule(course.id, newSectionTitle);
            setModules([...modules, { ...newModule, lessons: [] }]);
            setNewSectionTitle("");
            setIsAddingSection(false);
            toast.success("Bölüm eklendi");
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("Bölüm eklenirken bir hata oluştu");
        } finally {
            setIsCreatingSection(false);
        }
    };

    const handleUpdateSection = async (moduleId: string, title?: string, dripDelayDays?: number, releaseAt?: string | null) => {
        try {
            await updateModule(moduleId, title, dripDelayDays, releaseAt);
            setModules(modules.map(m => {
                if (m.id === moduleId) {
                    return {
                        ...m,
                        title: title !== undefined ? title : m.title,
                        drip_delay_days: dripDelayDays !== undefined ? dripDelayDays : m.drip_delay_days,
                        release_at: releaseAt !== undefined ? releaseAt : m.release_at
                    };
                }
                return m;
            }));
            setEditingSectionId(null);
            setEditSectionTitle("");
            toast.success("Bölüm güncellendi");
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("Bölüm güncellenemedi");
        }
    };

    const handleDeleteSection = async (moduleId: string) => {
        if (!confirm("Bu bölümü silmek istediğinize emin misiniz?")) return;

        try {
            await deleteModule(moduleId);
            setModules(modules.filter(m => m.id !== moduleId));
            toast.success("Bölüm silindi");
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("Bölüm silinemedi");
        }
    };


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

                                {modules.length === 0 && !isAddingSection && (
                                    <div className="flex-1 flex items-start justify-center pt-4">
                                        <div className="bg-white p-16 rounded-xl border border-gray-200 shadow-sm max-w-5xl w-full text-center">
                                            <h3 className="text-2xl font-bold text-gray-900 mb-4">Kurs içeriğinizi oluşturun</h3>
                                            <p className="text-gray-500 mb-8 max-w-lg mx-auto">
                                                Bir kurs bölümü ekleyerek başlayın ve ardından dersleri ekleyin.
                                            </p>
                                            <Button
                                                size="lg"
                                                className="rounded-full bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 shadow-sm px-8"
                                                onClick={() => setIsAddingSection(true)}
                                            >
                                                + Bölüm ekle
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {(modules.length > 0 || isAddingSection) && (
                                    <div className="flex-1 overflow-y-auto">
                                        <div className="max-w-5xl mx-auto pb-20">
                                            {/* Header Stats & Add Button */}
                                            <div className="flex items-center justify-between mb-4 mt-4">
                                                <div className="font-semibold text-gray-900">
                                                    {modules.length} bölüm • {modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0)} ders
                                                </div>
                                                {!isAddingSection && (
                                                    <Button
                                                        className="bg-gray-900 text-white hover:bg-gray-800"
                                                        onClick={() => setIsAddingSection(true)}
                                                    >
                                                        + Bölüm ekle
                                                    </Button>
                                                )}
                                            </div>

                                            {/* Column Headers */}
                                            {(courseType === 'structured' || courseType === 'scheduled') && (
                                                <div className="border border-transparent mb-1">
                                                    <div className="p-4 py-0 grid grid-cols-[1fr_200px_180px_100px] items-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                                        <div className="pl-7 text-left">DERS ADI</div>
                                                        <div className="text-left">{courseType === 'scheduled' ? 'ZAMANLAMA' : 'GECİKME'}</div>
                                                        <div className="text-left flex items-center gap-1">
                                                            E-POSTA BİLDİRİMİ
                                                            <HelpCircle className="w-3 h-3 text-gray-400" />
                                                        </div>
                                                        <div></div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Inline Add Section Form */}
                                            {isAddingSection && (
                                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-4 text-left">
                                                    <div className="font-semibold text-sm text-gray-900 mb-2 uppercase">BÖLÜM BAŞLIĞI</div>
                                                    <Input
                                                        autoFocus
                                                        placeholder="Örn. Giriş, Modül 1, Başlangıç..."
                                                        value={newSectionTitle}
                                                        onChange={(e) => setNewSectionTitle(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleAddSection()}
                                                        className="mb-4"
                                                    />
                                                    <div className="flex items-center gap-2">
                                                        <Button onClick={handleAddSection} disabled={isCreatingSection} className="bg-gray-900 text-white hover:bg-gray-800">
                                                            {isCreatingSection ? 'Ekleniyor...' : 'Bölüm ekle'}
                                                        </Button>
                                                        <Button variant="ghost" onClick={() => setIsAddingSection(false)}>İptal</Button>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="space-y-4">
                                                <DndContext
                                                    sensors={sensors}
                                                    collisionDetection={closestCenter}
                                                    onDragEnd={handleDragEnd}
                                                >
                                                    <SortableContext
                                                        items={modules.map(m => m.id)}
                                                        strategy={verticalListSortingStrategy}
                                                    >
                                                        {modules.map((module) => (
                                                            <SortableModuleItem key={module.id} id={module.id}>
                                                                {(dragListeners) => (
                                                                    <div className="bg-white border text-left border-gray-200 rounded-lg overflow-hidden">
                                                                        <div className="p-4 grid grid-cols-[1fr_200px_180px_100px] items-center bg-gray-50/50 border-b border-gray-100 group">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="cursor-move text-gray-400 hover:text-gray-600 outline-none" {...dragListeners}>
                                                                                    <Layout className="w-4 h-4" />
                                                                                </div>
                                                                                {editingSectionId === module.id ? (
                                                                                    <div className="flex items-center gap-2">
                                                                                        <Input
                                                                                            value={editSectionTitle}
                                                                                            onChange={(e) => setEditSectionTitle(e.target.value)}
                                                                                            className="h-8 w-64"
                                                                                        />
                                                                                        <Button size="sm" onClick={() => handleUpdateSection(module.id, editSectionTitle)}>Kaydet</Button>
                                                                                        <Button size="sm" variant="ghost" onClick={() => setEditingSectionId(null)}>İptal</Button>
                                                                                    </div>
                                                                                ) : (
                                                                                    <span className="font-semibold text-gray-900">{module.title}</span>
                                                                                )}
                                                                            </div>

                                                                            {(courseType === 'structured' || courseType === 'scheduled') ? (
                                                                                <>
                                                                                    {/* Schedule/Drip Settings */}
                                                                                    <div className="pr-4">
                                                                                        <Popover>
                                                                                            <PopoverTrigger asChild>
                                                                                                <Button variant="ghost" size="sm" className="h-8 w-full justify-between font-medium border border-gray-200 bg-white shadow-sm hover:bg-gray-50 rounded-full px-4 text-xs whitespace-nowrap overflow-hidden text-ellipsis">
                                                                                                    {courseType === 'scheduled' ? (
                                                                                                        module.release_at ? format(new Date(module.release_at), "d MMM yyyy, HH:mm", { locale: tr }) : "Tarih seçin"
                                                                                                    ) : (
                                                                                                        module.drip_delay_days === 0 ? "Kayıttan hemen sonra" : `${module.drip_delay_days} gün sonra`
                                                                                                    )}
                                                                                                    <ChevronLeft className="w-3 h-3 rotate-270 opacity-50 ml-2" />
                                                                                                </Button>
                                                                                            </PopoverTrigger>
                                                                                            <PopoverContent className="w-80 p-6" align="start">
                                                                                                {courseType === 'scheduled' ? (
                                                                                                    <div className="space-y-4">
                                                                                                        <div className="space-y-1">
                                                                                                            <h4 className="font-bold text-lg">Yayınlanma tarihi</h4>
                                                                                                            <p className="text-xs text-gray-500">Bu bölüm seçtiğiniz tarihte otomatik olarak yayınlanacaktır.</p>
                                                                                                        </div>
                                                                                                        <Input
                                                                                                            type="datetime-local"
                                                                                                            defaultValue={module.release_at ? format(new Date(module.release_at), "yyyy-MM-dd'T'HH:mm") : ""}
                                                                                                            onChange={(e) => {
                                                                                                                const date = e.target.value ? new Date(e.target.value).toISOString() : null;
                                                                                                                handleUpdateSection(module.id, undefined, undefined, date);
                                                                                                            }}
                                                                                                            className="h-10 border-gray-200 focus-visible:ring-gray-900"
                                                                                                        />
                                                                                                        <Button className="w-full bg-zinc-900 text-white rounded-lg h-10" onClick={() => { }}>Tamam</Button>
                                                                                                    </div>
                                                                                                ) : (
                                                                                                    <div className="space-y-4">
                                                                                                        <div className="space-y-1">
                                                                                                            <h4 className="font-bold text-lg">Yayınlama gecikmesi</h4>
                                                                                                        </div>
                                                                                                        <div className="flex items-center gap-3">
                                                                                                            <Input
                                                                                                                type="number"
                                                                                                                defaultValue={module.drip_delay_days || 0}
                                                                                                                className="w-20"
                                                                                                                onBlur={(e) => {
                                                                                                                    const val = parseInt(e.target.value);
                                                                                                                    if (val !== module.drip_delay_days) {
                                                                                                                        handleUpdateSection(module.id, undefined, val);
                                                                                                                    }
                                                                                                                }}
                                                                                                            />
                                                                                                            <span className="text-gray-600 font-medium">gün</span>
                                                                                                        </div>
                                                                                                        <p className="text-sm text-gray-500 leading-relaxed">
                                                                                                            Bu bölüm, bir öğrenci kurs alanına katıldıktan {(module.drip_delay_days || 0)} gün sonra yayınlanacaktır.
                                                                                                        </p>
                                                                                                        <Button className="w-full bg-zinc-900 text-white rounded-lg h-10" onClick={() => { }}>Tamam</Button>
                                                                                                    </div>
                                                                                                )}
                                                                                            </PopoverContent>
                                                                                        </Popover>
                                                                                    </div>

                                                                                    {/* Email Toggle placeholder */}
                                                                                    <div className="flex items-center justify-start">
                                                                                        <div className="w-10 h-5 bg-gray-200 rounded-full relative cursor-not-allowed">
                                                                                            <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm" />
                                                                                        </div>
                                                                                    </div>

                                                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                        <DropdownMenu>
                                                                                            <DropdownMenuTrigger asChild>
                                                                                                <Button size="sm" variant="outline" className="h-8 text-xs gap-1">
                                                                                                    + Yeni ekle
                                                                                                </Button>
                                                                                            </DropdownMenuTrigger>
                                                                                            <DropdownMenuContent align="end">
                                                                                                <DropdownMenuItem onClick={() => setAddingLessonToModuleId(module.id)}>
                                                                                                    Ders
                                                                                                </DropdownMenuItem>
                                                                                                <DropdownMenuItem disabled>
                                                                                                    Sınav (Yakında)
                                                                                                </DropdownMenuItem>
                                                                                            </DropdownMenuContent>
                                                                                        </DropdownMenu>
                                                                                        <DropdownMenu>
                                                                                            <DropdownMenuTrigger asChild>
                                                                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                                                                                    <MoreHorizontal className="w-4 h-4" />
                                                                                                </Button>
                                                                                            </DropdownMenuTrigger>
                                                                                            <DropdownMenuContent align="end">
                                                                                                <DropdownMenuItem onClick={() => {
                                                                                                    setEditingSectionId(module.id);
                                                                                                    setEditSectionTitle(module.title);
                                                                                                }}>
                                                                                                    Bölümü yeniden adlandır
                                                                                                </DropdownMenuItem>
                                                                                                <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteSection(module.id)}>
                                                                                                    Bölümü sil
                                                                                                </DropdownMenuItem>
                                                                                            </DropdownMenuContent>
                                                                                        </DropdownMenu>
                                                                                    </div>
                                                                                </>
                                                                            ) : (
                                                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity pr-4">
                                                                                    <DropdownMenu>
                                                                                        <DropdownMenuTrigger asChild>
                                                                                            <Button size="sm" variant="outline" className="h-8 text-xs gap-1">
                                                                                                + Yeni ekle
                                                                                            </Button>
                                                                                        </DropdownMenuTrigger>
                                                                                        <DropdownMenuContent align="end">
                                                                                            <DropdownMenuItem onClick={() => setAddingLessonToModuleId(module.id)}>
                                                                                                Ders
                                                                                            </DropdownMenuItem>
                                                                                            <DropdownMenuItem disabled>
                                                                                                Sınav (Yakında)
                                                                                            </DropdownMenuItem>
                                                                                        </DropdownMenuContent>
                                                                                    </DropdownMenu>
                                                                                    <DropdownMenu>
                                                                                        <DropdownMenuTrigger asChild>
                                                                                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                                                                                <MoreHorizontal className="w-4 h-4" />
                                                                                            </Button>
                                                                                        </DropdownMenuTrigger>
                                                                                        <DropdownMenuContent align="end">
                                                                                            <DropdownMenuItem onClick={() => {
                                                                                                setEditingSectionId(module.id);
                                                                                                setEditSectionTitle(module.title);
                                                                                            }}>
                                                                                                Bölümü yeniden adlandır
                                                                                            </DropdownMenuItem>
                                                                                            <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteSection(module.id)}>
                                                                                                Bölümü sil
                                                                                            </DropdownMenuItem>
                                                                                        </DropdownMenuContent>
                                                                                    </DropdownMenu>
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        {/* Add Lesson Input */}
                                                                        {addingLessonToModuleId === module.id && (
                                                                            <div className="p-4 bg-gray-50/30 border-b border-gray-100">
                                                                                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                                                                    <div className="font-semibold text-xs text-gray-500 mb-2 uppercase">DERS BAŞLIĞI</div>
                                                                                    <Input
                                                                                        autoFocus
                                                                                        placeholder="Örn. Ders 1: Giriş"
                                                                                        value={newLessonTitle}
                                                                                        onChange={(e) => setNewLessonTitle(e.target.value)}
                                                                                        onKeyDown={(e) => e.key === 'Enter' && handleCreateLesson(module.id)}
                                                                                        className="mb-3"
                                                                                    />
                                                                                    <div className="flex items-center gap-2">
                                                                                        <Button onClick={() => handleCreateLesson(module.id)} disabled={isCreatingLesson} size="sm" className="bg-gray-900 text-white hover:bg-gray-800">
                                                                                            {isCreatingLesson ? 'Ekleniyor...' : 'Ders ekle'}
                                                                                        </Button>
                                                                                        <Button variant="ghost" size="sm" onClick={() => {
                                                                                            setAddingLessonToModuleId(null);
                                                                                            setNewLessonTitle("");
                                                                                        }}>İptal</Button>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                        {/* Lessons List */}
                                                                        {module.lessons && module.lessons.length > 0 ? (
                                                                            <div className="divide-y relative z-0">
                                                                                <SortableContext
                                                                                    items={module.lessons.map((l: any) => l.id)}
                                                                                    strategy={verticalListSortingStrategy}
                                                                                >
                                                                                    {module.lessons.map((lesson: any) => (
                                                                                        <SortableLessonItem key={lesson.id} id={lesson.id}>
                                                                                            {(dragListeners) => (
                                                                                                <div className="p-3 pl-10 flex items-center justify-between hover:bg-gray-50 flex group bg-white">
                                                                                                    <div className="flex items-center gap-3">
                                                                                                        <div className="cursor-move text-gray-300 outline-none" {...dragListeners}>
                                                                                                            <Layout className="w-3 h-3" />
                                                                                                        </div>
                                                                                                        {editingLessonId === lesson.id ? (
                                                                                                            <div className="flex items-center gap-2">
                                                                                                                <Input
                                                                                                                    value={editLessonTitle}
                                                                                                                    onChange={(e) => setEditLessonTitle(e.target.value)}
                                                                                                                    className="h-7 w-64 text-sm"
                                                                                                                    autoFocus
                                                                                                                />
                                                                                                                <Button size="sm" className="h-7 text-xs" onClick={() => {
                                                                                                                    handleUpdateLesson(lesson.id, module.id, { title: editLessonTitle });
                                                                                                                    setEditingLessonId(null);
                                                                                                                }}>Kaydet</Button>
                                                                                                                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingLessonId(null)}>İptal</Button>
                                                                                                            </div>
                                                                                                        ) : (
                                                                                                            <span className="text-sm font-medium text-gray-700">{lesson.title}</span>
                                                                                                        )}
                                                                                                    </div>
                                                                                                    <div className="flex items-center gap-2">
                                                                                                        <DropdownMenu>
                                                                                                            <DropdownMenuTrigger asChild>
                                                                                                                <Button size="sm" variant="outline" className={cn(
                                                                                                                    "h-7 text-xs px-2 border-gray-200",
                                                                                                                    lesson.status === 'published' ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                                                                                )}>
                                                                                                                    {lesson.status === 'published' ? 'Yayınlandı' : 'Taslak'}
                                                                                                                </Button>
                                                                                                            </DropdownMenuTrigger>
                                                                                                            <DropdownMenuContent align="end">
                                                                                                                <DropdownMenuItem onClick={() => handleUpdateLesson(lesson.id, module.id, { status: 'published' })}>
                                                                                                                    <CheckCircle2 className={cn("w-4 h-4 mr-2", lesson.status === 'published' ? "opacity-100" : "opacity-0")} />
                                                                                                                    Yayınlandı
                                                                                                                </DropdownMenuItem>
                                                                                                                <DropdownMenuItem onClick={() => handleUpdateLesson(lesson.id, module.id, { status: 'draft' })}>
                                                                                                                    <CheckCircle2 className={cn("w-4 h-4 mr-2", lesson.status === 'draft' ? "opacity-100" : "opacity-0")} />
                                                                                                                    Taslak
                                                                                                                </DropdownMenuItem>
                                                                                                            </DropdownMenuContent>
                                                                                                        </DropdownMenu>

                                                                                                        <DropdownMenu>
                                                                                                            <DropdownMenuTrigger asChild>
                                                                                                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100">
                                                                                                                    <MoreHorizontal className="w-4 h-4 text-gray-400" />
                                                                                                                </Button>
                                                                                                            </DropdownMenuTrigger>
                                                                                                            <DropdownMenuContent align="end">
                                                                                                                <DropdownMenuItem onClick={() => {
                                                                                                                    setEditingLessonId(lesson.id);
                                                                                                                    setEditLessonTitle(lesson.title);
                                                                                                                }}>
                                                                                                                    Yeniden adlandır
                                                                                                                </DropdownMenuItem>
                                                                                                                <DropdownMenuItem onClick={() => {
                                                                                                                    setEditingLesson(lesson);
                                                                                                                }}>
                                                                                                                    Dersi düzenle
                                                                                                                </DropdownMenuItem>
                                                                                                                <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteLesson(lesson.id, module.id)}>
                                                                                                                    Dersi sil
                                                                                                                </DropdownMenuItem>
                                                                                                            </DropdownMenuContent>
                                                                                                        </DropdownMenu>
                                                                                                    </div>
                                                                                                </div>
                                                                                            )}
                                                                                        </SortableLessonItem>
                                                                                    ))}
                                                                                </SortableContext>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="p-4 text-center text-sm text-gray-500 py-8">
                                                                                Bu bölümde henüz ders yok.
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </SortableModuleItem>
                                                        ))}
                                                    </SortableContext>
                                                </DndContext>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'customize' && (
                            <CustomizeTab
                                course={course}
                                channel={channel}
                                onUpdate={() => router.refresh()}
                            />
                        )}

                        {activeTab === 'paywalls' && (
                            <CoursePaywallTab courseId={course.id} />
                        )}

                        {activeTab !== 'lessons' && activeTab !== 'customize' && activeTab !== 'paywalls' && (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                bu sekme yapım aşamasında: {tabs.find(t => t.id === activeTab)?.label}
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence >
    );
}
