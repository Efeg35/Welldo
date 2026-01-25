"use client";

import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash2, Settings, Users } from "lucide-react";
import { CreatePost } from "@/components/community/create-post";
import { PostCard } from "@/components/community/post-card";
import { FeedFilter } from "@/components/community/feed-filter";
import { useState } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteSpaceDialog } from "@/components/community/delete-space-dialog";
import { ChannelSettingsOverlay } from "@/components/community/channel-settings-overlay";

import { PostDetailModal } from "@/components/community/post-detail-modal";
import { Channel, Profile, Post } from "@/types";

interface PostFeedProps {
    channel: Channel;
    user: Profile;
    posts: Post[];
    communityId: string;
    channels?: Channel[];
    members?: Profile[];
}

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export function PostFeed({ channel, user, posts, communityId, channels = [], members = [] }: PostFeedProps) {
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [isPostDetailOpen, setIsPostDetailOpen] = useState(false);
    const isInstructor = user?.role === 'instructor' || user?.role === 'admin';
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentTopic = searchParams.get('topic');

    // Safely access settings
    const settings = channel.settings || {};
    const topics = (settings.topics as string[]) || [];

    const handleTopicClick = (topic: string | null) => {
        const params = new URLSearchParams(searchParams);
        if (topic) {
            params.set('topic', topic);
        } else {
            params.delete('topic');
        }
        router.push(`?${params.toString()}`);
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

                {/* Header Toolbar */}
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
                            <FeedFilter />

                            {/* Check permissions for creating posts */}
                            {(isInstructor || settings.allow_members_to_create_posts !== false) && (
                                <CreatePost
                                    user={user}
                                    communityId={communityId}
                                    channelId={channel.id}
                                    channels={channels}
                                    availableTopics={topics}
                                    allowTitle={settings.allow_post_title !== false}
                                    allowImage={settings.allow_cover_images !== false}
                                >
                                    <Button size="sm" className="bg-[#1c1c1c] hover:bg-black text-white rounded-full px-5 font-medium shadow-sm transition-all hover:scale-105 active:scale-95 h-9 cursor-pointer">
                                        Yeni gönderi
                                    </Button>
                                </CreatePost>
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

                    {/* Topic Navigation */}
                    {topics.length > 0 && (
                        <div className="px-4 md:px-8 pb-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
                            <button
                                onClick={() => handleTopicClick(null)}
                                className={cn(
                                    "px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                                    !currentTopic
                                        ? "bg-gray-900 text-white"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                )}
                            >
                                Tümü
                            </button>
                            {topics.map((topic) => (
                                <button
                                    key={topic}
                                    onClick={() => handleTopicClick(topic)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                                        currentTopic === topic
                                            ? "bg-gray-900 text-white"
                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    )}
                                >
                                    {topic}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

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

                {/* Feed Content Area */}
                <div className="max-w-5xl mx-auto w-full min-h-full">
                    <div className="px-6 py-8">
                        {posts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-32 text-center animate-in fade-in zoom-in duration-500">
                                <div className="space-y-6 max-w-md flex flex-col items-center">
                                    <h2 className="text-3xl font-bold tracking-tight text-foreground">
                                        {currentTopic ? `${currentTopic} konusunda gönderi yok` : 'Henüz gönderi yok'}
                                    </h2>
                                    <p className="text-muted-foreground text-lg text-center leading-relaxed">
                                        Güncellemeleri paylaş, soru sor veya bir tartışma başlat.
                                    </p>

                                    <div className="pt-2">
                                        {(isInstructor || settings.allow_members_to_create_posts !== false) && (
                                            <CreatePost
                                                user={user}
                                                communityId={communityId}
                                                channelId={channel.id}
                                                channels={channels}
                                                availableTopics={topics}
                                                allowTitle={settings.allow_post_title !== false}
                                                allowImage={settings.allow_cover_images !== false}
                                            >
                                                <Button size="lg" className="bg-[#1c1c1c] hover:bg-black text-white rounded-full px-8 h-12 text-base font-semibold shadow-md transition-all hover:shadow-lg cursor-pointer">
                                                    İlk gönderiyi sen paylaş
                                                </Button>
                                            </CreatePost>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 max-w-3xl mx-auto">
                                {(isInstructor || settings.allow_members_to_create_posts !== false) && (
                                    <CreatePost
                                        user={user}
                                        communityId={communityId}
                                        channelId={channel.id}
                                        channels={channels}
                                        availableTopics={topics}
                                        allowTitle={settings.allow_post_title !== false}
                                        allowImage={settings.allow_cover_images !== false}
                                    />
                                )}
                                {posts.map((post: any) => (
                                    <PostCard
                                        key={post.id}
                                        post={post}
                                        currentUserId={user?.id}
                                        onClick={(p) => {
                                            setSelectedPost(p);
                                            setIsPostDetailOpen(true);
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <PostDetailModal
                    post={selectedPost}
                    user={user}
                    isOpen={isPostDetailOpen}
                    onClose={() => setIsPostDetailOpen(false)}
                />
            </div>
        </div>
    );
}
