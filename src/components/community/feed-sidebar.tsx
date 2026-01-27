"use client";

import { Calendar, TrendingUp, Users, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";
import { getInitials } from "@/lib/utils";

interface FeedSidebarProps {
    upcomingEvents: any[];
    trendingPosts: any[];
    newMembers?: any[];
}

export function FeedSidebar({ upcomingEvents, trendingPosts, newMembers = [] }: FeedSidebarProps) {
    return (
        <div className="space-y-6">
            {/* Upcoming Events Widget */}
            <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-gray-900">Yaklaşan Etkinlikler</h3>
                    <Link href="/events" className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-0.5 transition-colors">
                        Tümü <ChevronRight className="w-3 h-3" />
                    </Link>
                </div>
                <div className="divide-y divide-border">
                    {upcomingEvents.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            Yaklaşan etkinlik yok
                        </div>
                    ) : (
                        upcomingEvents.map((event) => {
                            const startDate = new Date(event.start_time);
                            const dayNumber = format(startDate, "d");
                            const monthName = format(startDate, "MMM", { locale: tr }).toUpperCase();
                            const timeString = format(startDate, "HH:mm", { locale: tr });

                            return (
                                <Link
                                    key={event.id}
                                    href={`/events/${event.id}`}
                                    className="flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors"
                                >
                                    {/* Date Box */}
                                    <div className="flex-shrink-0 w-11 h-11 bg-gray-50 rounded-lg flex flex-col items-center justify-center border border-gray-200">
                                        <span className="text-[10px] font-bold text-gray-500 leading-tight">{monthName}</span>
                                        <span className="text-lg font-bold text-gray-900 leading-tight">{dayNumber}</span>
                                    </div>
                                    {/* Event Info */}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-sm text-gray-900 line-clamp-1">{event.title}</h4>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {timeString}
                                        </p>
                                    </div>
                                </Link>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Trending Posts Widget */}
            <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-gray-500" />
                    <h3 className="font-semibold text-sm text-gray-900">Popüler Gönderiler</h3>
                </div>
                <div className="divide-y divide-border">
                    {trendingPosts.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            Henüz popüler gönderi yok
                        </div>
                    ) : (
                        trendingPosts.map((post) => (
                            <Link
                                key={post.id}
                                href={`/community/post/${post.id}`}
                                className="flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors"
                            >
                                {/* Author Avatar */}
                                <Avatar className="w-8 h-8 flex-shrink-0">
                                    <AvatarImage src={post.profiles?.avatar_url} />
                                    <AvatarFallback className="text-xs bg-gray-100 text-gray-700 font-semibold">
                                        {getInitials(post.profiles?.full_name)}
                                    </AvatarFallback>
                                </Avatar>
                                {/* Post Info */}
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm text-gray-900 line-clamp-2">
                                        {post.title || post.content?.substring(0, 60)}
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {post.profiles?.full_name}
                                    </p>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>

            {/* New Members Widget (Optional) */}
            {newMembers.length > 0 && (
                <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <h3 className="font-semibold text-sm text-gray-900">Yeni Üyeler</h3>
                    </div>
                    <div className="p-4">
                        <div className="flex -space-x-2">
                            {newMembers.slice(0, 8).map((member, index) => (
                                <Avatar key={member.id || index} className="w-8 h-8 border-2 border-white">
                                    <AvatarImage src={member.avatar_url} />
                                    <AvatarFallback className="text-xs bg-gray-100 text-gray-700 font-semibold">
                                        {getInitials(member.full_name)}
                                    </AvatarFallback>
                                </Avatar>
                            ))}
                            {newMembers.length > 8 && (
                                <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
                                    +{newMembers.length - 8}
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Son 24 saatte katıldı
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
