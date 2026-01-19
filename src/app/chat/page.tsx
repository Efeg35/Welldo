import { DashboardLayout } from "@/components/layout";
import { getConversations, getMessages } from "@/actions/chat";
import { createClient } from "@/lib/supabase/server";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatThread } from "@/components/chat/chat-thread";
import { ChatProfile } from "@/components/chat/chat-profile";

interface ChatPageProps {
    searchParams: Promise<{ c?: string }>;
}

export default async function ChatPage({ searchParams }: ChatPageProps) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch conversations
    const conversations = await getConversations();

    // Determine current conversation
    // Next.js 15+ searchParams is a Promise
    const resolvedParams = await searchParams;
    let selectedConversationId = resolvedParams.c;

    // If no conversation selected but conversations exist, pick the first one
    if (!selectedConversationId && conversations.length > 0) {
        selectedConversationId = conversations[0].id;
    }

    let messages: any[] = [];
    let currentConversation: any = null;

    if (selectedConversationId) {
        messages = await getMessages(selectedConversationId);
        currentConversation = conversations.find((c: any) => c.id === selectedConversationId);
    }

    return (
        <DashboardLayout showSidebar={false} showSecondaryNav={false}>
            <div className="flex h-[calc(100vh-112px)] overflow-hidden">
                {/* Left Panel - DM List */}
                <ChatSidebar
                    conversations={conversations}
                    selectedId={selectedConversationId}
                />

                {/* Middle Panel - Chat Thread */}
                {selectedConversationId && currentConversation ? (
                    <ChatThread
                        conversationId={selectedConversationId}
                        messages={messages}
                        otherUser={currentConversation.otherUser}
                        currentUser={user}
                    />
                ) : (
                    <div className="flex-1 flex flex-col bg-background items-center justify-center text-muted-foreground">
                        <p>Bir sohbet seçin veya yeni bir mesaj gönderin.</p>
                    </div>
                )}

                {/* Right Panel - Profile */}
                {selectedConversationId && currentConversation && (
                    <ChatProfile user={currentConversation.otherUser} />
                )}
            </div>
        </DashboardLayout>
    );
}
