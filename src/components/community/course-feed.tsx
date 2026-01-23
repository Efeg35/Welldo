"use client";
import { useState, useEffect } from "react";

import { Channel, Course, Profile } from "@/types";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Lock, Users, Info, SquareActivity, Plus, PlayCircle, BookOpen, ArrowUpRight, Link as LinkIcon, Tags, Download, CreditCard, Loader2, CheckCircle2, Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const CourseBuilderOverlay = dynamic(() => import("@/components/courses/course-builder-overlay").then(mod => mod.CourseBuilderOverlay), {
    ssr: false,
    loading: () => null
});

import { deleteChannel } from "@/actions/community";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface CourseFeedProps {
    channel: Channel;
    user: Profile;
    course: Course | null;
    isPurchased?: boolean;
}

export function CourseFeed({ channel, user, course, isPurchased = false }: CourseFeedProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const isBuilderOpen = searchParams?.get('view') === 'builder';
    const paywall = course?.paywalls?.[0]; // Assuming single paywall

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        if (searchParams?.get('payment') === 'success') {
            toast.success("Ödeme başarılı! Kursa hoş geldiniz.");
            // Clean URL
            const params = new URLSearchParams(searchParams.toString());
            params.delete('payment');
            router.replace(`?${params.toString()}`);
        }
    }, [searchParams, router]);

    const handleDeleteCourse = async () => {
        setIsDeleting(true);
        try {
            await deleteChannel(channel.id);
            toast.success("Alan silindi");
            router.push('/');
        } catch (error) {
            toast.error("Alan silinemedi");
            console.error(error);
        } finally {
            setIsDeleting(false);
            setIsDeleteModalOpen(false);
        }
    };

    const handleViewCourse = () => {
        window.open(window.location.href, '_blank');
    };

    const handlePurchase = async () => {
        if (!course) return;
        setIsPurchasing(true);
        try {
            const response = await fetch('/api/payments/course', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseId: course.id }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Payment initialization failed');
            }

            if (data.paymentPageUrl) {
                window.location.href = data.paymentPageUrl;
            } else {
                throw new Error('No payment URL returned');
            }
        } catch (error: any) {
            toast.error(error.message || "Ödeme başlatılamadı");
            setIsPurchasing(false);
        }
    };


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
                                        <DropdownMenuItem className="cursor-pointer" onClick={handleViewCourse}>
                                            <span className="flex items-center gap-2 w-full">
                                                Kursu görüntüle
                                                <ArrowUpRight className="ml-auto h-4 w-4 text-gray-400" />
                                            </span>
                                        </DropdownMenuItem>

                                        <DropdownMenuItem className="cursor-pointer" onClick={handleCopyUrl}>
                                            <span className="flex items-center gap-2">
                                                <LinkIcon className="h-4 w-4 mr-2" />
                                                Bağlantıyı kopyala
                                            </span>
                                        </DropdownMenuItem>

                                        <Separator className="my-1" />

                                        <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50" onClick={() => setIsDeleteModalOpen(true)}>
                                            <span className="flex items-center gap-2">
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Alanı Sil
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




                    {/* Paywall Block */}
                    {paywall && !isPurchased && (
                        <div className="mb-12 bg-gray-900 text-white rounded-2xl p-8 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="space-y-4">
                                    <h3 className="text-2xl font-bold">Bu kursa erişmek için satın alın</h3>
                                    <p className="text-gray-300 max-w-lg">
                                        Tam müfredata, kaynak dosyalarına ve topluluk desteğine erişim kazanın. Ömür boyu erişim dahildir.
                                    </p>
                                    <div className="flex items-center gap-4 text-sm text-gray-300">
                                        <div className="flex items-center gap-1">
                                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                                            <span>Süresiz Erişim</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                                            <span>Sertifika</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center gap-3 min-w-[200px]">
                                    <div className="text-3xl font-bold">
                                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: paywall.currency }).format(paywall.price)}
                                    </div>
                                    <Button
                                        size="lg"
                                        className="w-full bg-white text-gray-900 hover:bg-gray-100 hover:scale-105 transition-transform font-bold shadow-lg"
                                        onClick={handlePurchase}
                                        disabled={isPurchasing}
                                    >
                                        {isPurchasing ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                İşleniyor...
                                            </>
                                        ) : (
                                            <>
                                                Hemen Satın Al
                                            </>
                                        )}
                                    </Button>
                                    <div className="text-xs text-center text-gray-400">
                                        Güvenli ödeme - İyzico altyapısı
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}


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
                                                    {lesson.status === 'published' && (isPurchased || lesson.is_free) ? <PlayCircle className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
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
                                                <Button size="sm" variant="outline" className="opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0" disabled={!isPurchased && !lesson.is_free}>
                                                    {(!isPurchased && !lesson.is_free) ? <Lock className="w-4 h-4" /> : 'Başla'}
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

            {/* Delete Confirmation Modal */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Bu alanı silmek istediğinize emin misiniz?</DialogTitle>
                        <DialogDescription className="pt-2">
                            Devam ederseniz, bu alanla ilişkili <strong>TÜM verileri kalıcı olarak</strong> kaybedeceksiniz. Buna şunlar dahildir:
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-2">
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm text-gray-600 space-y-2 mb-4">
                            <h4 className="font-semibold text-gray-900 mb-2">Kurs Verileri:</h4>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Bölümler ve dersler</li>
                                <li>Tüm üyelerin tamamlanma ilerlemeleri</li>
                                <li>Videolar ve dosyalar</li>
                                <li>Yorumlar</li>
                                <li>Alan üyeleri</li>
                                <li>Alan ayarları: Kilit ekranları, konular, linkler vb.</li>
                            </ul>
                        </div>

                        <p className="text-sm text-gray-600 mb-2">
                            Onaylamak için lütfen kutucuğa <strong>SİLELİM</strong> yazın:
                        </p>
                        <Input
                            value={deleteConfirmationText}
                            onChange={(e) => setDeleteConfirmationText(e.target.value)}
                            placeholder="SİLELİM"
                            className="bg-white"
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteModalOpen(false)}
                            disabled={isDeleting}
                        >
                            İptal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteCourse}
                            disabled={deleteConfirmationText !== 'SİLELİM' || isDeleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Siliniyor...
                                </>
                            ) : (
                                'Onayla'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
