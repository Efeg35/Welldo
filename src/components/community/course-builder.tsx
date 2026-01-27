"use client";

import { useState, useTransition } from "react";
import { Course, CourseModule, CourseLesson } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Plus, Trash2, GripVertical, ChevronDown, ChevronRight,
    Video, FileText, CheckCircle, Eye, EyeOff, Save, X
} from "lucide-react";
import {
    createModule, createLesson, updateLesson,
    deleteModule, deleteLesson
} from "@/actions/courses";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface CourseBuilderProps {
    course: Course;
}

export function CourseBuilder({ course }: CourseBuilderProps) {
    const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleAddModule = () => {
        const title = prompt("Modül başlığı:");
        if (title) {
            startTransition(async () => {
                await createModule(course.id, title);
                toast.success("Modül eklendi");
            });
        }
    };

    return (
        <div className="flex h-[calc(100vh-65px)] bg-gray-50">
            {/* Sidebar: Curriculum Structure */}
            <div className="w-80 bg-white border-r overflow-y-auto flex-shrink-0 flex flex-col">
                <div className="p-4 border-b flex items-center justify-between bg-gray-50/50">
                    <h2 className="font-semibold text-sm uppercase tracking-wider text-gray-500">Müfredat</h2>
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={handleAddModule}>
                        <Plus className="w-3 h-3" /> Modül
                    </Button>
                </div>

                <div className="p-4 space-y-4">
                    {course.modules?.map((module) => (
                        <ModuleItem
                            key={module.id}
                            module={module}
                            activeLessonId={activeLessonId}
                            onSelectLesson={setActiveLessonId}
                        />
                    ))}

                    {(!course.modules || course.modules.length === 0) && (
                        <div className="text-center py-8 text-gray-400 text-sm">
                            Henüz modül yok.
                            <br />
                            "Modül" butonuna tıklayarak başla.
                        </div>
                    )}
                </div>
            </div>

            {/* Main Area: Lesson Editor */}
            <div className="flex-1 overflow-y-auto">
                {activeLessonId ? (
                    <LessonEditor
                        key={activeLessonId} // Re-mount on change ensuring fresh state
                        lesson={course.modules?.flatMap(m => m.lessons || []).find(l => l.id === activeLessonId)!}
                    />
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <FileText className="w-8 h-8 text-gray-400" />
                        </div>
                        <p>Düzenlemek için soldan bir ders seçin.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function ModuleItem({ module, activeLessonId, onSelectLesson }: { module: CourseModule, activeLessonId: string | null, onSelectLesson: (id: string) => void }) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isPending, startTransition] = useTransition();

    const handleAddLesson = (e: React.MouseEvent) => {
        e.stopPropagation();
        const title = prompt("Ders başlığı:");
        if (title) {
            startTransition(async () => {
                await createLesson(module.id, title);
                toast.success("Ders eklendi");
                setIsExpanded(true);
            });
        }
    };

    const handleDeleteModule = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm("Bu modülü ve içindeki tüm dersleri silmek istediğine emin misin?")) {
            startTransition(async () => {
                await deleteModule(module.id);
                toast.success("Modül silindi");
            });
        }
    };

    return (
        <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
            <div
                className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2 font-medium text-sm">
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                    {module.title}
                </div>
                <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-gray-400 hover:text-red-600" onClick={handleDeleteModule}>
                        <Trash2 className="w-3 h-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-gray-400 hover:text-blue-600" onClick={handleAddLesson} title="Ders Ekle">
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {isExpanded && (
                <div className="divide-y border-t">
                    {module.lessons?.map((lesson) => (
                        <div
                            key={lesson.id}
                            className={cn(
                                "flex items-center gap-3 p-3 pl-8 text-sm cursor-pointer hover:bg-blue-50 transition-colors group",
                                activeLessonId === lesson.id ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-600"
                            )}
                            onClick={() => onSelectLesson(lesson.id)}
                        >
                            <GripVertical className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 cursor-grab" />
                            <div className="flex-1 truncate">{lesson.title}</div>
                            {lesson.status === 'published' && <CheckCircle className="w-3 h-3 text-green-500" />}
                        </div>
                    ))}
                    {(!module.lessons || module.lessons.length === 0) && (
                        <div className="p-3 pl-8 text-xs text-gray-400 italic">Ders yok</div>
                    )}
                </div>
            )}
        </div>
    );
}

function LessonEditor({ lesson }: { lesson: CourseLesson }) {
    const [title, setTitle] = useState(lesson.title);
    const [content, setContent] = useState(lesson.content || "");
    const [videoUrl, setVideoUrl] = useState(lesson.video_url || "");
    const [isFree, setIsFree] = useState(lesson.is_free);
    const [status, setStatus] = useState<"draft" | "published">(lesson.status || "draft");
    const [isSaving, startTransition] = useTransition();

    const handleSave = () => {
        startTransition(async () => {
            try {
                await updateLesson(lesson.id, {
                    title,
                    content,
                    video_url: videoUrl,
                    is_free: isFree,
                    status
                });
                toast.success("Değişiklikler kaydedildi");
            } catch (error) {
                toast.error("Hata oluştu");
            }
        });
    };

    const handleDelete = async () => {
        if (confirm("Bu dersi silmek istediğine emin misin?")) {
            // Need a way to unselect in parent, but for now simple delete action
            try {
                await deleteLesson(lesson.id);
                toast.success("Ders silindi");
            } catch (error) {
                toast.error("Hata oluştu");
            }
        }
    }

    return (
        <div className="max-w-3xl mx-auto p-8">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold">Ders Düzenle</h1>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200" onClick={handleDelete}>
                        <Trash2 className="w-4 h-4 mr-2" /> Sil
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white">
                        {isSaving ? "Kaydediliyor..." : (
                            <>
                                <Save className="w-4 h-4 mr-2" /> Kaydet
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <div className="space-y-6 bg-white p-6 rounded-xl border shadow-sm">
                <div className="space-y-2">
                    <Label>Ders Başlığı</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>

                <div className="space-y-2">
                    <Label>Video URL (YouTube, Vimeo, Loom)</Label>
                    <div className="relative">
                        <Video className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <Input
                            className="pl-9"
                            placeholder="https://..."
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>İçerik / Açıklama</Label>
                    <Textarea
                        className="min-h-[200px]"
                        placeholder="Ders içeriğini buraya yazın..."
                        value={typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
                        onChange={(e) => setContent(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-2 gap-6 pt-4 border-t">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-0.5">
                            <Label className="text-base">Ücretsiz Önizleme</Label>
                            <p className="text-xs text-muted-foreground">Kayıt olmayanlar bu dersi izleyebilir</p>
                        </div>
                        <Switch checked={isFree} onCheckedChange={setIsFree} />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-0.5">
                            <Label className="text-base">Yayınla</Label>
                            <p className="text-xs text-muted-foreground">Öğrencilere görünür yap</p>
                        </div>
                        <Switch checked={status === 'published'} onCheckedChange={(c) => setStatus(c ? 'published' : 'draft')} />
                    </div>
                </div>

            </div>
        </div>
    );
}
