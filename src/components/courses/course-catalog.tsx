"use client";

import { useState } from "react";
import { Course, Channel, Paywall } from "@/types";
import { CourseGridCard } from "./course-grid-card";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { CreateCourseButton } from "./create-course-button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type EnrichedCourse = Course & {
    channel: Channel;
    paywalls?: Paywall[];
    isOwned: boolean;
};

interface CourseCatalogProps {
    courses: EnrichedCourse[];
    isInstructor: boolean;
    communityId: string;
    communitySlug: string;
}

export function CourseCatalog({ courses, isInstructor, communityId, communitySlug }: CourseCatalogProps) {
    const [filter, setFilter] = useState<'all' | 'my'>('all');
    const [selectedTopic, setSelectedTopic] = useState<string>("Hepsi");
    const [searchQuery, setSearchQuery] = useState("");

    // Extract unique topics from all courses
    const allTopics = Array.from(new Set(courses.flatMap(c => c.topics || []))).sort();
    const topics = ["Hepsi", ...allTopics];

    const filteredCourses = courses.filter(course => {
        // Tab Filter
        if (filter === 'my' && !course.isOwned && !isInstructor) return false;

        // Topic Filter
        if (selectedTopic !== "Hepsi") {
            if (!course.topics?.includes(selectedTopic)) return false;
        }

        // Search Filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return course.title.toLowerCase().includes(q) ||
                course.description?.toLowerCase().includes(q);
        }

        return true;
    });

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Toolbar */}
            <div className="px-6 pt-8 pb-1 border-b bg-white sticky top-0 z-20 space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Kurslar</h1>

                    {isInstructor && (
                        <div className="flex-shrink-0">
                            <CreateCourseButton
                                communityId={communityId}
                                communitySlug={communitySlug}
                                label="Kurs oluştur"
                                size="sm"
                            />
                        </div>
                    )}
                </div>

                {/* Navbar Action Area */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        {/* Tabs (All / My) */}
                        <div className="bg-gray-100/60 p-1 rounded-full inline-flex border border-gray-200/50">
                            <button
                                onClick={() => setFilter('all')}
                                className={cn(
                                    "px-6 py-2 text-sm font-semibold rounded-full transition-all duration-200",
                                    filter === 'all'
                                        ? "bg-black text-white shadow-md shadow-black/10"
                                        : "text-gray-500 hover:text-black hover:bg-gray-200/50"
                                )}
                            >
                                Tüm kurslar
                            </button>
                            <button
                                onClick={() => setFilter('my')}
                                className={cn(
                                    "px-6 py-2 text-sm font-semibold rounded-full transition-all duration-200",
                                    filter === 'my'
                                        ? "bg-black text-white shadow-md shadow-black/10"
                                        : "text-gray-500 hover:text-black hover:bg-gray-200/50"
                                )}
                            >
                                Kurslarım
                            </button>
                        </div>

                        {/* Search */}
                        <div className="relative w-full max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Kurs ara..."
                                className="pl-9 h-10 bg-gray-50 border-gray-200 focus:bg-white focus:ring-1 focus:ring-black rounded-full transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Topic Pills (Etiket Mantığı) */}
                    {topics.length > 1 && (
                        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-4 -mx-1 px-1">
                            {topics.map((topic) => (
                                <button
                                    key={topic}
                                    onClick={() => setSelectedTopic(topic)}
                                    className={cn(
                                        "px-4 py-1.5 text-sm font-medium rounded-full border transition-all whitespace-nowrap",
                                        selectedTopic === topic
                                            ? "bg-black border-black text-white shadow-sm"
                                            : "bg-white border-gray-200 text-gray-600 hover:border-black hover:text-black"
                                    )}
                                >
                                    {topic}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 bg-gray-50/20">
                {filteredCourses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-32">
                        {filteredCourses.map(course => (
                            <CourseGridCard
                                key={course.id}
                                course={course}
                                isOwned={course.isOwned}
                                isInstructor={isInstructor}
                                communitySlug={communitySlug}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-5">
                        <div className="w-20 h-20 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center shadow-sm">
                            <BookOpen className="w-10 h-10 text-gray-300" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {filter === 'my' ? 'Kayıtlı kursunuz yok' : 'Kurs bulunamadı'}
                            </h2>
                            <p className="text-gray-500 max-w-sm mx-auto">
                                {filter === 'my'
                                    ? 'Henüz bir kursa kayıt olmadınız. Tüm kurslar sekmesine göz atabilirsiniz.'
                                    : searchQuery
                                        ? `"${searchQuery}" aramasına uygun kurs bulunamadı.`
                                        : selectedTopic !== "Hepsi"
                                            ? `${selectedTopic} kategorisinde henüz kurs bulunmuyor.`
                                            : 'Toplulukta henüz yayınlanmış bir kurs yok.'}
                            </p>
                        </div>
                        {selectedTopic !== "Hepsi" || searchQuery ? (
                            <Button variant="outline" className="rounded-full" onClick={() => { setSelectedTopic("Hepsi"); setSearchQuery(""); }}>
                                Tümünü Göster
                            </Button>
                        ) : filter === 'my' && (
                            <Button variant="outline" className="rounded-full" onClick={() => setFilter('all')}>
                                Kursları İncele
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function BookOpen(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
    )
}
