"use client";

import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash2 } from "lucide-react";
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

import { Channel, Profile, Post } from "@/types";

interface PostFeedProps {
    channel: Channel;
    user: Profile;
    posts: Post[];
    communityId: string;
}

export function PostFeed({ channel, user, posts, communityId }: PostFeedProps) {
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const isInstructor = user?.role === 'instructor' || user?.role === 'admin';

    return (
        <div className="flex flex-col h-full bg-[#FAFAFA]">
            <div className="flex-1 overflow-y-auto relative">
                {/* Header Toolbar */}
                <div className="sticky top-0 z-10 bg-white border-b border-border shadow-sm w-full">
                    <div className="w-full px-8 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">{channel.name}</h1>
                        </div>

                        <div className="flex items-center gap-3">
                            <FeedFilter />

                            <CreatePost user={user} communityId={communityId} channelId={channel.id}>
                                <Button size="sm" className="bg-[#1c1c1c] hover:bg-black text-white rounded-full px-5 font-medium shadow-sm transition-all hover:scale-105 active:scale-95 h-9 cursor-pointer">
                                    Yeni gönderi
                                </Button>
                            </CreatePost>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-muted/50 rounded-full h-9 w-9 cursor-pointer">
                                        <MoreHorizontal className="w-5 h-5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    {isInstructor && (
                                        <DropdownMenuItem
                                            className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                                            onClick={() => setIsDeleteModalOpen(true)}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            <span>Alanı Sil</span>
                                        </DropdownMenuItem>
                                    )}
                                    {!isInstructor && (
                                        <DropdownMenuItem className="text-muted-foreground italic h-8 flex items-center">
                                            Seçenek yok
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>

                <DeleteSpaceDialog
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    channelId={channel.id}
                    channelName={channel.name}
                />

                {/* Feed Content Area */}
                <div className="max-w-5xl mx-auto w-full min-h-full">
                    <div className="px-6 py-8">
                        {posts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-32 text-center animate-in fade-in zoom-in duration-500">
                                <div className="space-y-6 max-w-md flex flex-col items-center">
                                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Henüz gönderi yok</h2>
                                    <p className="text-muted-foreground text-lg text-center leading-relaxed">
                                        Güncellemeleri paylaş, soru sor veya bir tartışma başlat.
                                    </p>

                                    <div className="pt-2">
                                        <CreatePost user={user} communityId={communityId} channelId={channel.id}>
                                            <Button size="lg" className="bg-[#1c1c1c] hover:bg-black text-white rounded-full px-8 py-6 text-base font-medium shadow-md transition-all hover:shadow-lg cursor-pointer">
                                                Bir gönderi oluştur
                                            </Button>
                                        </CreatePost>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 max-w-3xl mx-auto">
                                {posts.map((post: any) => (
                                    <PostCard
                                        key={post.id}
                                        post={post}
                                        currentUserId={user?.id}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
