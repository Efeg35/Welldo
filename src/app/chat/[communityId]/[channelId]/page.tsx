import { createClient } from "@/lib/supabase/server";
import { ChatRoom } from "@/components/chat";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface ChatRoomPageProps {
    params: Promise<{
        communityId: string;
        channelId: string;
    }>;
}

export default async function ChatRoomPage({ params }: ChatRoomPageProps) {
    const { communityId, channelId } = await params;
    const supabase = await createClient();

    // Fetch channel and community info
    const { data: channel } = await supabase
        .from("channels")
        .select(`*, community:communities(*)`)
        .eq("id", channelId)
        .single();

    if (!channel) {
        notFound();
    }

    return (
        <div className="flex h-[calc(100vh-8rem)] flex-col">
            {/* Back Button Header */}
            <div className="flex items-center gap-3 border-b border-border bg-background px-4 py-3">
                <Link
                    href="/chat"
                    className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="font-semibold">{channel.community?.name}</h1>
                    <p className="text-xs text-muted-foreground">#{channel.name}</p>
                </div>
            </div>

            {/* Chat Room */}
            <ChatRoom channelId={channelId} channelName={channel.name} />
        </div>
    );
}
