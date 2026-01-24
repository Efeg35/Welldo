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

// --- Channel Chat Actions ---

// --- Channel Chat Actions ---

export async function getChannelMessages(channelId: string) {
    const supabase = await createClient();

    const { data: messages, error } = await supabase
        .from('messages')
        .select(`
            *,
            user:profiles(*), profiles:profiles!messages_user_id_fkey(*)
        `)
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true })
        .limit(100);

    if (error) {
        console.error("Error fetching channel messages:", error);
        return [];
    }

    return messages;
}

export async function sendChannelMessage(channelId: string, content: string, attachments: any = []) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");
    if (!content.trim() && attachments.length === 0) throw new Error("Message cannot be empty");

    const { error, data: message } = await supabase
        .from('messages')
        .insert({
            channel_id: channelId,
            user_id: user.id,
            content: content.trim(),
            attachments: attachments
        })
        .select(`
            *,
            user:profiles(*)
        `)
        .single();

    if (error) {
        console.error("Error sending channel message:", error);
        throw new Error(`Failed to send message: ${error.message}`);
    }

    revalidatePath(`/community`);
    return message;
}

export async function uploadFile(file: File, contextId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${contextId}/${fileName}`;

    // Use a shared bucket or specific one. 'chat_attachments' seems appropriate.
    const { error: uploadError } = await supabase.storage
        .from('chat_attachments')
        .upload(filePath, file);

    if (uploadError) {
        console.error("Upload error:", uploadError);
        throw new Error("Failed to upload file");
    }

    const { data: { publicUrl } } = supabase.storage
        .from('chat_attachments')
        .getPublicUrl(filePath);

    return {
        url: publicUrl,
        name: file.name,
        type: file.type,
        size: file.size
    };
}

export async function getChannelMembers(channelId: string) {
    const supabase = await createClient();

    // Ideally, we should fetch from a channel_members table or similar. 
    // Since we don't have a direct "channel_members" table for all channels (only space_members for private),
    // we might need to rely on who has posted or who is in the community if it's open.
    // For this MVP, let's fetch users who are members of the COMMUNITY.
    // AND if it is a private space, filter by space_members.

    // 1. Get Channel to check type/community
    const { data: channel } = await supabase
        .from('channels')
        .select('community_id, access_level')
        .eq('id', channelId)
        .single();

    if (!channel) return [];

    let query = supabase
        .from('memberships')
        .select(`
            user_id,
            profile:profiles(*)
        `)
        .eq('community_id', channel.community_id)
        .eq('status', 'active');

    // If it is a SECRET or PRIVATE channel (and not course type which uses enrollments), 
    // we should ideally filter. But for now, let's just return community members 
    // and maybe distinct them. 
    // A better approach for "Chat UI" is usually showing "Online" or "All Members".

    const { data: memberships, error } = await query;

    if (error) return [];

    // Map to profile list
    return memberships.map(m => m.profile).filter(Boolean);
}
