"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, MapPin, Video, Calendar, User, AlignLeft, MoreHorizontal, Trash2, Settings, Users } from "lucide-react";
import { CreateEventModal } from "./create-event";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteSpaceDialog } from "./delete-space-dialog";
import { ChannelSettingsOverlay } from "@/components/community/channel-settings-overlay";
import { cn } from "@/lib/utils";

import { Channel, Profile, Event } from "@/types";

interface EventFeedProps {
    channel: Channel;
    user: Profile;
    initialEvents: Event[];
    members?: Profile[];
}

import { EditEventModal } from "./edit-event-modal";

export function EventFeed({ channel, user, initialEvents, members = [] }: EventFeedProps) {
    const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editEventId, setEditEventId] = useState<string | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const isInstructor = user?.role === 'instructor' || user?.role === 'admin';

    // Settings
    const settings = channel.settings || {};

    const handleDraftCreated = (eventId: string) => {
        setEditEventId(eventId);
    };

    return (
        <div className="flex flex-col h-full bg-[#FAFAFA]">
            <div className="flex-1 overflow-y-auto relative">

                {/* Cover Image */}
                {settings.cover_image_url && (
                    <div className="w-full h-48 md:h-64 relative shrink-0">
                        <img
                            src={settings.cover_image_url}
                            className="w-full h-full object-cover"
                            alt={channel.name}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                )}

                {/* Toolbar */}
                <div className={cn("sticky top-0 z-10 bg-white border-b border-border shadow-sm w-full", settings.cover_image_url && "border-t-0")}>
                    <div className="w-full px-4 md:px-8 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                                {channel.name}
                                {(isInstructor || !settings.hide_member_count) && (
                                    <span className="text-sm font-normal text-muted-foreground ml-2">
                                        ({members.length} üye)
                                    </span>
                                )}
                            </h1>
                        </div>

                        <div className="flex items-center gap-3">
                            {(isInstructor || settings.allow_members_to_create_posts !== false) && (
                                <Button onClick={() => setIsCreateModalOpen(true)} size="sm" className="bg-[#1c1c1c] hover:bg-black text-white rounded-full px-5 font-medium shadow-sm transition-all hover:scale-105 active:scale-95 h-9 cursor-pointer">
                                    Yeni etkinlik
                                </Button>
                            )}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-muted/50 rounded-full h-9 w-9 cursor-pointer">
                                        <MoreHorizontal className="w-5 h-5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    {isInstructor ? (
                                        <>
                                            <DropdownMenuItem
                                                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                                                onClick={() => setIsDeleteModalOpen(true)}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                <span>Alanı Sil</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="cursor-pointer"
                                                onClick={() => setIsSettingsOpen(true)}
                                            >
                                                <Settings className="h-4 w-4 mr-2" />
                                                <span>Ayarlar</span>
                                            </DropdownMenuItem>
                                        </>
                                    ) : (
                                        <DropdownMenuItem
                                            className="cursor-pointer"
                                            onClick={() => setIsSettingsOpen(true)}
                                        >
                                            <Users className="h-4 w-4 mr-2" />
                                            <span>Üyeler</span>
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-5xl mx-auto w-full min-h-full p-8">
                    {/* Filter Tabs */}
                    <div className="flex items-center gap-2 mb-8">
                        <div className="relative inline-flex rounded-full border bg-white p-1 shadow-sm">
                            <button
                                onClick={() => setFilter('upcoming')}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filter === 'upcoming' ? 'bg-gray-100 text-foreground shadow-sm' : 'text-muted-foreground hover:bg-gray-50'}`}
                            >
                                Yaklaşan
                            </button>
                            <button
                                onClick={() => setFilter('past')}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filter === 'past' ? 'bg-gray-100 text-foreground shadow-sm' : 'text-muted-foreground hover:bg-gray-50'}`}
                            >
                                Geçmiş
                            </button>
                        </div>
                    </div>

                    {/* Events List or Empty State */}
                    {initialEvents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed shadow-sm">
                            <h3 className="text-xl font-bold text-foreground mb-2">Yaklaşan etkinlik yok</h3>
                            <p className="text-muted-foreground mb-6">Planlanan etkinlikler burada görünecek.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {initialEvents.map(event => (
                                <div key={event.id} className="bg-white p-5 rounded-xl border shadow-sm hover:shadow-md transition-all flex gap-5 group cursor-pointer">
                                    {/* Date Box */}
                                    <div className="flex flex-col items-center justify-center w-16 h-16 rounded-lg bg-gray-50 border text-center shrink-0">
                                        <span className="text-xs uppercase font-bold text-red-500">{format(new Date(event.start_time), 'MMM', { locale: tr })}</span>
                                        <span className="text-xl font-bold text-gray-900">{format(new Date(event.start_time), 'd')}</span>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-bold text-foreground group-hover:text-blue-600 transition-colors truncate">{event.title}</h3>
                                        <div className="text-sm text-muted-foreground mt-1 flex flex-wrap items-center gap-3">
                                            <span className="flex items-center gap-1.5">
                                                <Calendar className="w-4 h-4" />
                                                {format(new Date(event.start_time), 'EEE, HH:mm', { locale: tr })} - {format(new Date(event.end_time), 'HH:mm')}
                                            </span>
                                            {event.event_type === 'online_zoom' ? (
                                                <span className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md text-xs font-medium">
                                                    <Video className="w-3 h-3" />
                                                    Zoom
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5">
                                                    <MapPin className="w-4 h-4" />
                                                    {event.location_address || 'Konum belirtilmedi'}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action / Host */}
                                    <div className="flex flex-col items-end justify-between">
                                        {/* Could put host avatar here */}
                                        <Button size="sm" variant="outline" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            Detaylar
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <CreateEventModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                channelId={channel.id}
                communityId={channel.community_id}
                currentUser={user}
                onDraftCreated={handleDraftCreated}
            />

            {editEventId && (
                <EditEventModal
                    isOpen={!!editEventId}
                    onClose={() => setEditEventId(null)}
                    eventId={editEventId}
                    communityId={channel.community_id}
                    currentUser={user}
                />
            )}
            <DeleteSpaceDialog
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                channelId={channel.id}
                channelName={channel.name}
            />
            {isSettingsOpen && (
                <ChannelSettingsOverlay
                    channel={channel}
                    members={members}
                    isAdmin={isInstructor}
                    onClose={() => setIsSettingsOpen(false)}
                />
            )}
        </div>
    );
}

