"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateCourseModal } from "./create-course-modal";

interface CreateCourseButtonProps {
    communityId: string;
    communitySlug: string;
    label?: string;
    size?: "default" | "sm" | "lg" | "icon";
    className?: string;
}

export function CreateCourseButton({
    communityId,
    communitySlug,
    label = "Create course",
    size = "default",
    className
}: CreateCourseButtonProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <Button onClick={() => setIsOpen(true)} size={size} className={className}>
                {size !== "icon" && <Plus className="w-4 h-4 mr-2" />}
                {label}
            </Button>

            <CreateCourseModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                communityId={communityId}
                communitySlug={communitySlug}
            />
        </>
    );
}
