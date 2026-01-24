"use client";

import Link from "next/link";
import { Course, Channel, Paywall } from "@/types"; // Adjust import path
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, PlayCircle, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface CourseGridCardProps {
    course: Course & { channel?: Channel; paywalls?: Paywall[] };
    isOwned: boolean;
    isInstructor: boolean;
    communitySlug: string;
}

export function CourseGridCard({ course, isOwned, isInstructor, communitySlug }: CourseGridCardProps) {
    const paywall = course.paywalls?.[0];
    const isLocked = !isOwned && !isInstructor && !course.paywalls?.length; // Logic check: if not owned, not instructor, and NO paywall? Wait, if no paywall it's usually free.
    // Actually, let's refine access logic passed from parent or derived here.
    // Plan said: 
    // If access == true -> Watch
    // If access == false -> Locked/Price

    // Let's assume isOwned covers "has access" (including free enrollment).

    const targetUrl = `/community/${course.slug}`;

    return (
        <Link href={targetUrl} className="block h-full">
            <div className="group flex flex-col bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 h-full relative">
                {/* Cover Image Area */}
                <div className="relative aspect-video bg-gray-100 overflow-hidden">
                    {course.thumbnail_url ? (
                        <img
                            src={course.thumbnail_url}
                            alt={course.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                            <div className="flex flex-col items-center gap-2">
                                <span className="text-4xl">📚</span>
                            </div>
                        </div>
                    )}

                    {/* Status Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                        {course.status === 'draft' && isInstructor ? (
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    window.location.href = `/community/${course.slug}?tab=customize&view=builder#access`;
                                }}
                                className="bg-yellow-50 text-yellow-700 border border-yellow-200/60 shadow-sm rounded-full px-2 py-0.5 text-[10px] font-bold hover:bg-yellow-100 hover:border-yellow-300 transition-all cursor-pointer flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-yellow-500/20 z-30"
                            >
                                <div className="w-1 h-1 rounded-full bg-yellow-500 animate-pulse"></div>
                                TASLAK
                            </button>
                        ) : (
                            course.status === 'draft' && (
                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200 shadow-sm">
                                    TASLAK
                                </Badge>
                            )
                        )}
                        {course.status === 'published' && isInstructor && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 shadow-sm">
                                YAYINDA
                            </Badge>
                        )}
                    </div>

                    {/* Lock / Price Badge for Non-Owners */}
                    {!isOwned && !isInstructor && (
                        <div className="absolute top-3 right-3">
                            {paywall ? (
                                <Badge className="bg-white/90 text-gray-900 backdrop-blur-md shadow-sm border-0 font-bold px-3 py-1 flex items-center gap-1">
                                    <Lock className="w-3 h-3" />
                                    {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: paywall.currency }).format(paywall.price)}
                                </Badge>
                            ) : (
                                <Badge className="bg-white/90 text-gray-900 backdrop-blur-md shadow-sm border-0 font-bold px-3 py-1 flex items-center gap-1">
                                    <span>Ücretsiz</span>
                                </Badge>
                            )}
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="flex flex-col flex-1 p-5">
                    <div className="flex-1">
                        {/* Category / Metadata */}
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                            {course.channel?.category || "Genel"}
                        </div>

                        <h3 className="font-bold text-lg text-gray-900 line-clamp-1 group-hover:text-primary transition-colors mb-2">
                            {course.title}
                        </h3>

                        {/* Optional: Member count or other metadata can go here if available */}
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            {/* Placeholder for member count if we had it */}
                            {/* <Users className="w-4 h-4" /> 120 Üye */}
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
