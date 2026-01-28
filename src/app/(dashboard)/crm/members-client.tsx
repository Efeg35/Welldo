"use client";

import { useState, useEffect, useCallback } from "react";
import { MembersHeader } from "@/components/members/members-header";
import { MembersFilterBar, ActiveFilter } from "@/components/members/members-filter-bar";
import { MembersGrid } from "@/components/members/members-grid";
import { MembersList } from "@/components/members/members-list";
import { MemberProfilePanel } from "@/components/members/member-profile-panel";
import { AddMemberModal } from "@/components/members/add-member-modal";
import { getMembers, Member, MemberFilters } from "@/actions/members";

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
    const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);

    // Panel States
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);

    // Convert active filters to API format
    const buildFiltersFromActive = useCallback(() => {
        const filters: MemberFilters = {};

        activeFilters.forEach(filter => {
            switch (filter.id) {
                case 'name':
                    filters.name = filter.value;
                    break;
                case 'role':
                    filters.role = filter.value as any;
                    break;
                case 'location':
                    filters.location = filter.value;
                    break;
                case 'score':
                    filters.activityScore = filter.value as any;
                    break;
            }
        });

        if (searchQuery) {
            filters.search = searchQuery;
        }

        return filters;
    }, [activeFilters, searchQuery]);

    // Fetch members with filters
    const fetchMembers = useCallback(async () => {
        setIsLoading(true);
        try {
            const filters = buildFiltersFromActive();
            const result = await getMembers(communityId, filters);
            setMembers(result.members);
        } catch (error) {
            console.error(error);
        }
        setIsLoading(false);
    }, [communityId, buildFiltersFromActive]);

    // Debounced search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchMembers();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, activeFilters, fetchMembers]);

    // Filter handlers
    const handleAddFilter = (filter: ActiveFilter) => {
        setActiveFilters(prev => [...prev, filter]);
    };

    const handleRemoveFilter = (filterId: string) => {
        setActiveFilters(prev => prev.filter(f => f.id !== filterId));
    };

    // Member actions
    const handleMemberClick = (member: Member) => {
        setSelectedMember(member);
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
                        onAddMember={() => setShowAddMemberModal(true)}
                    />
                    <MembersFilterBar
                        activeFilters={activeFilters}
                        onAddFilter={handleAddFilter}
                        onRemoveFilter={handleRemoveFilter}
                    />
                </div>
            </div>

            {/* Main Content: Gray Background */}
            <div className="flex-1 p-6 overflow-y-auto">
                <div className="max-w-7xl mx-auto w-full">
                    {viewMode === "grid" ? (
                        <MembersGrid
                            members={members}
                            isLoading={isLoading}
                            onMemberClick={handleMemberClick}
                            onAddMember={() => setShowAddMemberModal(true)}
                        />
                    ) : (
                        <MembersList
                            members={members}
                            isLoading={isLoading}
                            onMemberClick={handleMemberClick}
                        />
                    )}
                </div>
            </div>

            {/* Member Profile Panel */}
            <MemberProfilePanel
                member={selectedMember}
                open={!!selectedMember}
                onClose={() => setSelectedMember(null)}
                isAdmin={isAdmin}
            />

            {/* Add Member Modal */}
            <AddMemberModal
                open={showAddMemberModal}
                onClose={() => setShowAddMemberModal(false)}
                communityId={communityId}
                onSuccess={fetchMembers}
            />
        </div>
    );
}
