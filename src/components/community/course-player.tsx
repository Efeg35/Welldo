"use client";

import { Course, CourseLesson, CourseModule } from "@/types";
import { Button } from "@/components/ui/button";
import { CheckCircle, ChevronLeft, ChevronRight, FileText, Menu, PlayCircle, Video } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { QuizContent } from "@/types";
import { QuizPlayer } from "./quiz-player";

interface CoursePlayerProps {
    course: Course;
    initialLessonId?: string;
}

export function CoursePlayer({ course, initialLessonId }: CoursePlayerProps) {
    // Flatten lessons to find current, next, prev
    const allLessons = course.modules?.flatMap(m => m.lessons || []) || [];
    const [currentLessonId, setCurrentLessonId] = useState<string>(
        initialLessonId || allLessons[0]?.id || ""
    );

    const currentLesson = allLessons.find(l => l.id === currentLessonId);
    const currentIndex = allLessons.findIndex(l => l.id === currentLessonId);
    const prevLesson = allLessons[currentIndex - 1];
    const nextLesson = allLessons[currentIndex + 1];

    if (!currentLesson) {
        return (
            <div className="flex h-full items-center justify-center text-center p-8">
                <div>
                    <h2 className="text-xl font-bold mb-2">Ders bulunamadı</h2>
                    <Button asChild variant="outline">
                        <Link href="?">Kursa Geri Dön</Link>
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-full bg-white">
            {/* Sidebar: Course Navigation */}
            <div className="w-80 border-r bg-gray-50 flex flex-col h-full overflow-hidden hidden lg:flex">
                <div className="p-4 border-b bg-white">
                    <Link href="?" className="flex items-center text-sm text-gray-500 hover:text-gray-900 mb-3 transition-colors">
                        <ChevronLeft className="w-4 h-4 mr-1" /> Kurss Paneline Dön
                    </Link>
                    <h2 className="font-bold text-gray-900 truncate" title={course.title}>{course.title}</h2>
                    <div className="mt-2 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 w-[0%]"></div> {/* Progress Bar Placeholder */}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">0% Tamamlandı</div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {course.modules?.map((module, mIndex) => (
                        <div key={module.id}>
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-2">
                                {module.title}
                            </h3>
                            <div className="space-y-1">
                                {module.lessons?.map((lesson, lIndex) => (
                                    <button
                                        key={lesson.id}
                                        onClick={() => setCurrentLessonId(lesson.id)}
                                        className={cn(
                                            "w-full text-left flex items-start p-2 rounded-lg text-sm transition-colors",
                                            currentLessonId === lesson.id
                                                ? "bg-blue-100/50 text-blue-700 font-medium"
                                                : "text-gray-700 hover:bg-gray-100"
                                        )}
                                    >
                                        <div className="mt-0.5 mr-3 text-gray-400">
                                            {lesson.video_url ? <PlayCircle className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            {lesson.title}
                                            <div className="text-[10px] text-gray-400 mt-0.5">
                                                {/* Duration placeholder */}
                                                5 dk
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content: Video & Text */}
            <div className="flex-1 overflow-y-auto bg-white flex flex-col">
                {/* Mobile Header */}
                <div className="lg:hidden p-4 border-b flex items-center justify-between">
                    <Link href="?" className="flex items-center text-sm text-gray-500">
                        <ChevronLeft className="w-4 h-4 mr-1" /> Geri
                    </Link>
                    <span className="font-bold truncate">{currentLesson.title}</span>
                    <Button size="icon" variant="ghost">
                        <Menu className="w-5 h-5" />
                    </Button>
                </div>

                <div className="max-w-4xl mx-auto w-full p-6 lg:p-12 pb-24">
                    {/* Content Switcher */}
                    {(typeof currentLesson.content === 'object' && currentLesson.content !== null && (currentLesson.content as any).type === 'quiz') ? (
                        <QuizPlayer
                            quiz={currentLesson.content as unknown as QuizContent}
                            onComplete={(passed, score) => {
                                // Optional: save progress to DB
                                console.log("Quiz completed", { passed, score });
                            }}
                            nextLessonAvailable={!!nextLesson}
                            onNextLesson={() => nextLesson && setCurrentLessonId(nextLesson.id)}
                        />
                    ) : (
                        <>
                            {/* Video Player */}
                            {currentLesson.video_url && (
                                <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-lg mb-8 relative group">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        {/* Simple Embed Placeholder */}
                                        {isYoutube(currentLesson.video_url) ? (
                                            <iframe
                                                src={getYoutubeEmbed(currentLesson.video_url)}
                                                className="w-full h-full"
                                                allowFullScreen
                                                frameBorder="0"
                                            />
                                        ) : (
                                            <div className="text-white text-center">
                                                <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                <p className="text-sm opacity-70">Video kaynağı yüklenemedi veya desteklenmiyor.</p>
                                                <a href={currentLesson.video_url} target="_blank" className="text-blue-400 hover:underline mt-2 inline-block">Linke git</a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Lesson Content */}
                            <div className="prose prose-blue max-w-none">
                                <h1 className="text-3xl font-bold text-gray-900 mb-6">{currentLesson.title}</h1>
                                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                                    {typeof currentLesson.content === 'string' ? currentLesson.content : "İçerik görüntülenemiyor."}
                                </div>
                            </div>

                            <Separator className="my-12" />

                            {/* Navigation Footer */}
                            <div className="flex items-center justify-between">
                                <div className="flex gap-2">
                                    {prevLesson && (
                                        <Button variant="outline" onClick={() => setCurrentLessonId(prevLesson.id)}>
                                            <ChevronLeft className="w-4 h-4 mr-2" />
                                            Önceki: {prevLesson.title}
                                        </Button>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    {nextLesson ? (
                                        <Button onClick={() => setCurrentLessonId(nextLesson.id)}>
                                            Sonraki: {nextLesson.title}
                                            <ChevronRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    ) : (
                                        <Button className="bg-green-600 hover:bg-green-700 text-white">
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Kursu Tamamla
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// Helpers
function isYoutube(url: string) {
    return url.includes('youtube.com') || url.includes('youtu.be');
}

function getYoutubeEmbed(url: string) {
    let videoId = "";
    if (url.includes('youtube.com/watch?v=')) {
        videoId = url.split('v=')[1]?.split('&')[0];
    } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1];
    }
    return `https://www.youtube.com/embed/${videoId}`;
}
