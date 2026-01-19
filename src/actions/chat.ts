"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getConversations() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    // Fetch conversations where the user is a participant
    // This is a bit complex with Supabase joins, usually better to fetch conversation IDs first or use a view
    // For simplicity, we'll fetch connections. 
    // Actually, let's fetch the conversations the user is part of, and then for each conversation, fetch the OTHER participant.

    // 1. Get Conversation IDs
    const { data: participation } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

    if (!participation || participation.length === 0) return [];

    const conversationIds = participation.map(p => p.conversation_id);

    // 2. Get Conversations details and other participants
    const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
            *,
            conversation_participants (
                user_id,
                profiles (
                    id,
                    full_name,
                    avatar_url,
                    role
                )
            ),
            direct_messages (
                content,
                created_at,
                is_read,
                sender_id
            )
        `)
        .in('id', conversationIds)
        .order('updated_at', { ascending: false });

    if (error) {
        console.error("Error fetching conversations:", error);
        return [];
    }

    // Process data to be friendly for the UI
    // We want to find the "other" user to display their name/avatar
    const formattedConversations = conversations.map(conv => {
        const otherParticipant = conv.conversation_participants.find(
            (p: any) => p.user_id !== user.id
        )?.profiles;

        // Get value of the last message
        // Sort messages by created_at desc to get the latest (though our query layout might return all, we should limit in production)
        const lastMessage = conv.direct_messages.sort((a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];

        return {
            id: conv.id,
            otherUser: otherParticipant, // Can be undefined if it's a self-chat or removed user
            lastMessage: lastMessage,
            updated_at: conv.updated_at
        };
    });

    return formattedConversations;
}

export async function getMessages(conversationId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data: messages, error } = await supabase
        .from('direct_messages')
        .select(`
            id,
            content,
            created_at,
            sender_id,
            is_read,
            profiles:sender_id (
                id,
                full_name,
                avatar_url
            )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error("Error fetching messages:", error);
        return [];
    }

    return messages;
}

export async function sendMessage(conversationId: string, content: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase
        .from('direct_messages')
        .insert({
            conversation_id: conversationId,
            sender_id: user.id,
            content
        });

    if (error) {
        console.error("Error sending message:", error);
        throw new Error("Failed to send message");
    }

    // Update conversation timestamp
    await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

    revalidatePath(`/chat`);
    revalidatePath(`/chat?c=${conversationId}`);
}

export async function startConversation(otherUserId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // Check if conversation already exists (optional, keeping simple for now)

    // Create conversation
    const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({})
        .select()
        .single();

    if (convError) throw convError;

    // Add participants
    const { error: partError } = await supabase
        .from('conversation_participants')
        .insert([
            { conversation_id: conversation.id, user_id: user.id },
            { conversation_id: conversation.id, user_id: otherUserId }
        ]);

    if (partError) throw partError;

    revalidatePath('/chat');
    return conversation.id;
}
