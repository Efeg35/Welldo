"use client";
import { useState, useEffect } from "react";

import { Channel, Course, Profile } from "@/types";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Lock, Users, Info, SquareActivity, Plus, PlayCircle, BookOpen, ArrowUpRight, Link as LinkIcon, Tags, Download } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const CourseBuilderOverlay = dynamic(() => import("@/components/courses/course-builder-overlay").then(mod => mod.CourseBuilderOverlay), {
    ssr: false,
    loading: () => null
});

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CourseFeedProps {
    channel: Channel;
    user: Profile;
    course: Course | null;
}

export function CourseFeed({ channel, user, course }: CourseFeedProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);
    const isBuilderOpen = searchParams?.get('view') === 'builder';

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleCloseBuilder = () => {
        const params = new URLSearchParams(searchParams?.toString());
        params.delete('view');
        router.push(`?${params.toString()}`);
    };

    const handleOpenBuilder = () => {
        const params = new URLSearchParams(searchParams?.toString());
        params.set('view', 'builder');
        router.push(`?${params.toString()}`);
    };

    const handleCopyUrl = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        toast.success("Bağlantı kopyalandı");
    };

    if (!course) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-semibold">Kurs verisi bulunamadı.</h2>
                <p className="text-muted-foreground">Lütfen yönetici ile iletişime geçin.</p>
            </div>
        )
    }

    // Prevents hydration mismatch for Radix UI components (DropdownMenu)
    if (!isMounted) {
        return null;
    }

    return (
        <div className="flex h-full bg-white">
            {/* Main Content */}
            <div className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-4xl mx-auto">
                    {/* Course Header */}
                    <div className="mb-12">
                        <div className="flex items-center justify-between">
                            <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">Kurs paneli</h1>
                            <div className="flex items-center gap-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreHorizontal className="h-5 w-5 text-gray-400" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuItem className="cursor-pointer">
                                            <span className="flex items-center gap-2 w-full">
                                                Kursu görüntüle
                                                <ArrowUpRight className="ml-auto h-4 w-4 text-gray-400" />
                                            </span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="cursor-pointer">
                                            <span className="flex items-center gap-2 w-full">
                                                Kilit ekranını düzenle
                                                <ArrowUpRight className="ml-auto h-4 w-4 text-gray-400" />
                                            </span>
                                        </DropdownMenuItem>
                                        <Separator className="my-1" />
                                        <DropdownMenuItem className="cursor-pointer" onClick={handleCopyUrl}>
                                            <span className="flex items-center gap-2">
                                                <LinkIcon className="h-4 w-4 mr-2" />
                                                Bağlantıyı kopyala
                                            </span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="cursor-pointer">
                                            <span className="flex items-center gap-2">
                                                <Tags className="h-4 w-4 mr-2" />
                                                Etiketleri düzenle
                                            </span>
                                        </DropdownMenuItem>
                                        <Separator className="my-1" />
                                        <DropdownMenuItem className="cursor-pointer">
                                            <span className="flex items-center gap-2">
                                                <Download className="h-4 w-4 mr-2" />
                                                Yorumları dışa aktar
                                            </span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="cursor-pointer">
                                            <span className="flex items-center gap-2">
                                                <Download className="h-4 w-4 mr-2" />
                                                Öğrencileri dışa aktar
                                            </span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="cursor-pointer">
                                            <span className="flex items-center gap-2">
                                                <Download className="h-4 w-4 mr-2" />
                                                Sınav sonuçlarını dışa aktar
                                            </span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <Button className="rounded-full bg-gray-900 text-white hover:bg-gray-800" onClick={handleOpenBuilder}>
                                    Dersleri düzenle
                                </Button>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-gray-600">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-400 uppercase text-xs tracking-wider">DURUM:</span>
                                <Badge variant={course.status === 'published' ? 'default' : 'secondary'} className="capitalize">
                                    {course.status === 'published' ? 'Yayında' : 'Taslak'}
                                </Badge>
                            </div>
                            <div className="w-px h-4 bg-gray-300"></div>
                            <div className="flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-gray-400" />
                                <span className="font-semibold text-gray-400 uppercase text-xs tracking-wider">KURS TÜRÜ:</span>
                                <span className="font-medium text-gray-900 capitalize">
                                    {channel.settings?.course_type === 'structured' ? 'Yapılandırılmış' :
                                        channel.settings?.course_type === 'scheduled' ? 'Zamanlanmış' :
                                            'Kendi Hızında'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                        <div className="p-6 rounded-2xl border border-gray-100 bg-white shadow-sm flex flex-col justify-between h-32">
                            <div className="flex items-center gap-2 text-gray-500 mb-1">
                                <span className="font-medium">Bekleme listesi</span>
                                <Info className="w-4 h-4" />
                            </div>
                            <span className="text-4xl font-bold text-gray-900">0</span>
                        </div>
                        <div className="p-6 rounded-2xl border border-gray-100 bg-white shadow-sm flex flex-col justify-between h-32">
                            <div className="text-gray-500 font-medium mb-1">Ortalama tamamlama oranı</div>
                            <span className="text-4xl font-bold text-gray-900">0%</span>
                        </div>
                    </div>

                    {/* Empty State / Content / Curriculum */}
                    {(course.modules && course.modules.length > 0) ? (
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-gray-900">Müfredat</h3>
                            {course.modules.map((module) => (
                                <div key={module.id} className="border rounded-xl bg-white overflow-hidden shadow-sm">
                                    <div className="bg-gray-50/50 px-5 py-4 border-b font-semibold text-gray-800 flex items-center justify-between">
                                        {module.title}
                                        <span className="text-xs font-normal text-gray-500">{module.lessons?.length || 0} ders</span>
                                    </div>
                                    <div className="divide-y">
                                        {module.lessons?.map((lesson) => (
                                            <a
                                                key={lesson.id}
                                                href={`?view=lesson&lessonId=${lesson.id}`}
                                                className="flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors group"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                                    {lesson.status === 'published' ? <PlayCircle className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors text-lg">
                                                        {lesson.title}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                        <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">Video</span>
                                                        <span>•</span>
                                                        {lesson.is_free ? <span className="text-green-600 font-medium">✨ Ücretsiz Önizleme</span> : "Kayıtlı Üye"}
                                                    </div>
                                                </div>
                                                <Button size="sm" variant="outline" className="opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                    Başla
                                                </Button>
                                            </a>
                                        ))}
                                        {(!module.lessons || module.lessons.length === 0) && (
                                            <div className="p-8 text-center bg-gray-50/30">
                                                <p className="text-gray-400 italic">Bu modüle henüz ders eklenmemiş.</p>
                                                <Button variant="link" asChild className="mt-2 text-blue-600">
                                                    <a href="?view=builder">Ders Ekle +</a>
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <h3 className="text-3xl font-bold text-gray-900 mb-4">Bu kurs şu an {course.status === 'published' ? 'yayında' : 'taslak'} modunda.</h3>
                            <p className="text-lg text-gray-400 max-w-lg mx-auto leading-relaxed">
                                Kursunuzu yayınladığınızda etkileşim verileri burada görünecektir.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Builder Overlay */}
            {isBuilderOpen && (
                <CourseBuilderOverlay
                    course={course}
                    channel={channel}
                    onClose={handleCloseBuilder}
                />
            )}
        </div>
    );
}
