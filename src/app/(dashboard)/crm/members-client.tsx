"use client";

import { useState, useEffect, useCallback } from "react";
import { MembersHeader } from "@/components/members/members-header";
import { MembersFilterBar, ActiveFilter } from "@/components/members/members-filter-bar";
import { MembersGrid } from "@/components/members/members-grid";
import { MembersList } from "@/components/members/members-list";
import { MemberProfilePanel } from "../../../components/members/member-profile-panel";
import { AddMemberModal } from "../../../components/members/add-member-modal";
import { getMembers, Member, MemberFilters, getUpcomingEvents } from "@/actions/members";
import { updateUserPresence } from "@/actions/user-presence";
import { LocationUpdateModal } from "@/components/members/location-update-modal";

interface MembersClientProps {
    communityId: string;
    communityName: string;
    initialMembers: Member[];
    userRole: string;
    spaces: { id: string; name: string; type: string }[];
    currentUserLocation?: string | null;
}

export function MembersClient({ communityId, communityName, initialMembers, userRole, spaces, currentUserLocation: initialUserLocation }: MembersClientProps) {
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [members, setMembers] = useState<Member[]>(initialMembers);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
    const [upcomingEvents, setUpcomingEvents] = useState<{ id: string; title: string; start_time: string }[]>([]);
    const [accessLevel, setAccessLevel] = useState<'open' | 'private'>('open');
    const [sortBy, setSortBy] = useState("newest");

    // Panel States
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);

    // Near Me Logic
    const [currentUserLocation, setCurrentUserLocation] = useState<string | null>(initialUserLocation || null);
    const [showLocationModal, setShowLocationModal] = useState(false);

    const isNearMeActive = activeFilters.some(f => f.id === 'location' && f.value === currentUserLocation);

    // Filter handlers
    const handleAddFilter = (filter: ActiveFilter) => {
        setActiveFilters(prev => [...prev, filter]);
    };

    const handleRemoveFilter = (filterId: string) => {
        setActiveFilters(prev => prev.filter(f => f.id !== filterId));
    };

    const handleNearMeClick = () => {
        if (!currentUserLocation) {
            setShowLocationModal(true);
            return;
        }

        if (isNearMeActive) {
            // Remove location filter
            handleRemoveFilter('location');
        } else {
            // Remove any existing location filter first to avoid duplicates/conflicts
            const otherFilters = activeFilters.filter(f => f.id !== 'location');

            // Add location filter
            setActiveFilters([
                ...otherFilters,
                {
                    id: 'location',
                    label: 'Konum',
                    value: currentUserLocation,
                    displayValue: currentUserLocation
                }
            ]);
        }
    };

    const handleLocationUpdateSuccess = (newLocation: string) => {
        setCurrentUserLocation(newLocation);
        setShowLocationModal(false);

        // Auto-apply filter after update
        // Remove existing location filter first
        const otherFilters = activeFilters.filter(f => f.id !== 'location');

        setActiveFilters([
            ...otherFilters,
            {
                id: 'location',
                label: 'Konum',
                value: newLocation,
                displayValue: newLocation
            }
        ]);
    };

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
                case 'rsvp':
                    filters.upcomingEventId = filter.value;
                    break;
                case 'status':
                    filters.onlineStatus = filter.value as any;
                    break;
                case 'access':
                    filters.spaceAccess = filter.value;
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

    // Fetch upcoming events on mount
    useEffect(() => {
        const fetchEvents = async () => {
            const events = await getUpcomingEvents(communityId);
            setUpcomingEvents(events);
        };
        fetchEvents();
    }, [communityId]);

    // Update presence on mount and every 5 minutes
    useEffect(() => {
        // Initial update
        updateUserPresence();

        // Periodic update (every 2 minutes to be safe)
        const interval = setInterval(() => {
            updateUserPresence();
        }, 2 * 60 * 1000);

        return () => clearInterval(interval);
    }, []);

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
                        accessLevel={accessLevel}
                        onAccessLevelChange={setAccessLevel}
                        communityName={communityName}
                        communityId={communityId}
                        currentSort={sortBy}
                        onSettingsSave={(settings) => {
                            setSortBy(settings.defaultSort);
                            setViewMode(settings.defaultView);
                        }}
                    />
                    <MembersFilterBar
                        activeFilters={activeFilters}
                        onAddFilter={handleAddFilter}
                        onRemoveFilter={handleRemoveFilter}
                        availableSpaces={spaces}
                        upcomingEvents={upcomingEvents}
                        onNearMeClick={handleNearMeClick}
                        isNearMeActive={isNearMeActive}
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

            {/* Location Update Modal */}
            <LocationUpdateModal
                open={showLocationModal}
                onClose={() => setShowLocationModal(false)}
                onSuccess={handleLocationUpdateSuccess}
            />
        </div>
    );
}
