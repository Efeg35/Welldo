"use client";

import { useState, useEffect } from "react";
import { MembersHeader } from "@/components/members/members-header";
import { MembersFilterBar } from "@/components/members/members-filter-bar";
import { MembersGrid } from "@/components/members/members-grid";
import { MembersList } from "@/components/members/members-list";
import { getMembers, Member } from "@/actions/members";
import { useDebounce } from "@/hooks/use-debounce";
// Note: If useDebounce doesn't exist I'll simulate it or simple effect. 
// Assuming useDebounce hook might not exist, I will implement a simple one inside or just fetch directly for now.

interface MembersClientProps {
    communityId: string;
    initialMembers: Member[];
    userRole: string;
}

export function MembersClient({ communityId, initialMembers, userRole }: MembersClientProps) {
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [members, setMembers] = useState<Member[]>(initialMembers);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Simple debounce logic
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery) {
                fetchMembers(searchQuery);
            } else if (searchQuery === "" && members.length !== initialMembers.length) {
                // Reset to initial if cleared, or refetch clean
                fetchMembers("");
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchMembers = async (query: string) => {
        setIsLoading(true);
        try {
            const result = await getMembers(communityId, { search: query });
            setMembers(result.members);
        } catch (error) {
            console.error(error);
        }
        setIsLoading(false);
    };

    const isAdmin = userRole === 'admin' || userRole === 'instructor';

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Top Section: White Background */}
            <div className="bg-white border-b border-gray-200 px-6 pt-4 pb-2">
                <div className="max-w-7xl mx-auto w-full">
                    <MembersHeader
                        viewMode={viewMode}
                        onChangeViewMode={setViewMode}
                        onSearch={setSearchQuery}
                        isAdmin={isAdmin}
                    />
                    <MembersFilterBar />
                </div>
            </div>

            {/* Main Content: Gray Background */}
            <div className="flex-1 p-6 overflow-y-auto">
                <div className="max-w-7xl mx-auto w-full">
                    {viewMode === "grid" ? (
                        <MembersGrid members={members} isLoading={isLoading} />
                    ) : (
                        <MembersList members={members} isLoading={isLoading} />
                    )}
                </div>
            </div>
        </div>
    );
}
