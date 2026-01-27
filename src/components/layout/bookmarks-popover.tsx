"use client";

import { useEffect, useState } from "react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { getBookmarkedPosts, getBookmarkedEvents } from "@/actions/community";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { MapPin, Video, Calendar, User, Bookmark, MessageCircle, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { getInitials } from "@/lib/utils";

export function BookmarksPopover() {
    const [open, setOpen] = useState(false);
    const [posts, setPosts] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("posts");

    const fetchBookmarks = async () => {
        setIsLoading(true);
        try {
            if (activeTab === 'posts') {
                const data = await getBookmarkedPosts();
                setPosts(data);
            } else if (activeTab === 'events') {
                const data = await getBookmarkedEvents();
                setEvents(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            fetchBookmarks();
        }
    }, [open, activeTab]);

    // Simple hack to support SVG as component since lucide-react Bookmark is filled differently by default
    const BookmarkIcon = () => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-bookmark"
        >
            <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
        </svg>
    );

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:bg-muted/50">
                    <BookmarkIcon />
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[400px] p-0 overflow-hidden rounded-xl shadow-2xl border-border">
                <div className="flex flex-col h-[500px] bg-white">
                    {/* Header */}
                    <div className="p-4 border-b bg-white">
                        <h3 className="font-bold text-lg">Kaydedilenler</h3>
                    </div>

                    {/* Tabs */}
                    <div className="px-4 border-b flex items-center gap-6 bg-white overflow-x-auto no-scrollbar">
                        <button
                            onClick={() => setActiveTab('posts')}
                            className={cn(
                                "py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                                activeTab === 'posts' ? "border-black text-black" : "border-transparent text-gray-500 hover:text-black"
                            )}
                        >
                            Gönderiler
                        </button>
                        <button
                            onClick={() => setActiveTab('comments')}
                            className={cn(
                                "py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                                activeTab === 'comments' ? "border-black text-black" : "border-transparent text-gray-500 hover:text-black"
                            )}
                        >
                            Yorumlar
                        </button>
                        <button
                            onClick={() => setActiveTab('events')}
                            className={cn(
                                "py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                                activeTab === 'events' ? "border-black text-black" : "border-transparent text-gray-500 hover:text-black"
                            )}
                        >
                            Etkinlikler
                        </button>
                        <button className="py-3 text-sm font-medium border-b-2 border-transparent text-gray-400 cursor-not-allowed whitespace-nowrap">
                            Lessons
                        </button>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto bg-white">
                        {isLoading ? (
                            <div className="p-8 text-center text-sm text-gray-500">Yükleniyor...</div>
                        ) : activeTab === 'posts' && posts.length > 0 ? (
                            <div className="divide-y">
                                {posts.map(post => (
                                    <Link
                                        key={post.id}
                                        href={`/community/post/${post.id}`}
                                        onClick={() => setOpen(false)}
                                        className="block w-full p-4 hover:bg-gray-50 transition-colors text-left group"
                                    >
                                        <div className="flex items-start gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={post.profiles?.avatar_url || undefined} />
                                                <AvatarFallback className="bg-gray-100 text-gray-700 font-semibold text-xs">
                                                    {getInitials(post.profiles?.full_name as string)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-semibold text-sm truncate">{post.profiles?.full_name}</span>
                                                    <span className="text-[10px] text-gray-400 ml-2 whitespace-nowrap">
                                                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: tr })}
                                                    </span>
                                                </div>

                                                {post.title && <h4 className="font-bold text-sm mb-1 truncate">{post.title}</h4>}
                                                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                                    {post.content}
                                                </p>

                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span className="bg-muted px-1.5 py-0.5 rounded text-[10px]">
                                                        {post.channel_name || 'Genel'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : activeTab === 'events' && events.length > 0 ? (
                            <div className="divide-y">
                                {events.map(event => (
                                    <Link
                                        key={event.id}
                                        href={`/community/${event.community?.slug}/${event.channel?.slug}`}
                                        onClick={() => setOpen(false)}
                                        className="block w-full p-4 hover:bg-gray-50 transition-colors text-left group"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-gray-50 border text-center shrink-0">
                                                <span className="text-[10px] uppercase font-bold text-red-500">{format(new Date(event.start_time), 'MMM', { locale: tr })}</span>
                                                <span className="text-lg font-bold text-gray-900">{format(new Date(event.start_time), 'd')}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-sm mb-1 truncate group-hover:text-gray-900 transition-colors">
                                                    {event.title}
                                                </h4>
                                                <div className="text-[11px] text-muted-foreground space-y-0.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar className="w-3 h-3" />
                                                        {format(new Date(event.start_time), 'HH:mm', { locale: tr })} - {format(new Date(event.end_time), 'HH:mm')}
                                                    </div>
                                                    {event.event_type === 'online_zoom' ? (
                                                        <div className="flex items-center gap-1.5 text-gray-900">
                                                            <Video className="w-3 h-3" />
                                                            Zoom
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5 truncate">
                                                            <MapPin className="w-3 h-3" />
                                                            {event.location_address || 'Konum belirtilmedi'}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="mt-2 text-[10px] text-gray-400">
                                                    {event.community?.name} • {event.channel?.name}
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : activeTab === 'posts' ? (
                            <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white">
                                <div className="mb-4 text-gray-300">
                                    <Bookmark className="w-12 h-12" strokeWidth={1} />
                                </div>
                                <h4 className="font-bold text-lg mb-1">Kaydedilen gönderi yok</h4>
                                <p className="text-sm text-gray-500 max-w-[200px] mx-auto">
                                    Beğendiğiniz veya sonra okumak istediğiniz gönderileri kaydedebilirsiniz.
                                </p>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white">
                                <p className="text-sm text-gray-500">Bu kategori henüz boş.</p>
                            </div>
                        )}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
