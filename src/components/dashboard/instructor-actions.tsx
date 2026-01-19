"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreateSpaceModal } from "@/components/community/create-space-modal";
import { Plus, Video, ExternalLink, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { CreateCourseModal } from "@/components/courses/create-course-modal";

interface InstructorActionsProps {
    communityId: string;
    communitySlug: string;
}

export function InstructorActions({ communityId, communitySlug }: InstructorActionsProps) {
    const [isCreateSpaceOpen, setIsCreateSpaceOpen] = useState(false);
    const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(false);

    const handleCreateLink = () => {
        toast.info("Bağlantı oluşturma yakında eklenecek.");
    }

    const handleGoLive = () => {
        toast.info("Canlı yayın başlatma yakında eklenecek.");
    }

    return (
        <>
            <div className="grid md:grid-cols-3 gap-4">
                {/* Create Space */}
                <div
                    onClick={() => setIsCreateSpaceOpen(true)}
                    className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all cursor-pointer group hover:border-[#408FED]/50"
                >
                    <div className="w-10 h-10 rounded-lg bg-blue-100 text-[#408FED] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Plus className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold mb-1 text-foreground">Alan Oluştur</h3>
                    <p className="text-xs text-muted-foreground">Topluluğun için yeni bir tartışma veya içerik alanı yarat.</p>
                </div>

                {/* Create Course */}
                <div
                    onClick={() => setIsCreateCourseOpen(true)}
                    className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all cursor-pointer group hover:border-purple-500/50"
                >
                    <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Video className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold mb-1 text-foreground">Kurs Oluştur</h3>
                    <p className="text-xs text-muted-foreground">Video eğitim veya ders serisi hazırla.</p>
                </div>

                {/* Create Link */}
                <div
                    onClick={handleCreateLink}
                    className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all cursor-pointer group hover:border-green-500/50"
                >
                    <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <LinkIcon className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold mb-1 text-foreground">Bağlantı Ekle</h3>
                    <p className="text-xs text-muted-foreground">Sidebar'a harici linkler ekle.</p>
                </div>
            </div>

            <CreateSpaceModal
                isOpen={isCreateSpaceOpen}
                onClose={() => setIsCreateSpaceOpen(false)}
                communityId={communityId}
            />

            <CreateCourseModal
                isOpen={isCreateCourseOpen}
                onClose={() => setIsCreateCourseOpen(false)}
                communityId={communityId}
                communitySlug={communitySlug}
            />
        </>
    );
}
