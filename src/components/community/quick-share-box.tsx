"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus } from "lucide-react";
import { CreatePost } from "@/components/community/create-post";
import { Channel } from "@/types";
import { getInitials } from "@/lib/utils";

interface QuickShareBoxProps {
    user: any;
    communityId: string;
    channels: Channel[];
}

export function QuickShareBox({ user, communityId, channels }: QuickShareBoxProps) {
    const userName = user?.full_name || user?.user_metadata?.full_name || user?.email;

    return (
        <CreatePost user={user} communityId={communityId} channels={channels}>
            <div className="bg-white rounded-xl border border-border shadow-sm p-4 flex items-center gap-3 cursor-pointer hover:border-gray-400 transition-colors group">
                <Avatar className="w-10 h-10">
                    <AvatarImage src={user?.avatar_url || user?.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-gray-100 text-gray-700 font-semibold text-sm">
                        {getInitials(userName)}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-gray-400 text-sm select-none">
                    Bir şeyler paylaş...
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-gray-200 group-hover:text-gray-600 transition-colors">
                    <Plus className="w-5 h-5" />
                </div>
            </div>
        </CreatePost>
    );
}
