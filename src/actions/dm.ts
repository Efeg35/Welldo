"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Conversation, DirectMessage } from "@/types/dm";

export async function getConversations() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // Fetch conversations where current user is a participant
    const { data: participants, error } = await supabase
        .from('conversation_participants')
        .select(`
            conversation_id,
            conversation:conversations(
                *,
                participants:conversation_participants(
                    *,
                    profile:profiles(*)
                )
            )
        `)
        .eq('user_id', user.id);

    if (error) {
        console.error("Error fetching conversations:", error);
        return [];
    }

    // Process to get other participant's profile and last message
    const conversations = await Promise.all((participants || []).map(async (p: any) => {
        const conv = p.conversation;

        // Find the other participant
        const otherParticipant = conv.participants.find((cp: any) => cp.user_id !== user.id);

        // Get last message for preview
        const { data: lastMessage } = await supabase
            .from('direct_messages')
            .select('*, sender:profiles(*)')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        return {
            ...conv,
            other_participant: otherParticipant?.profile,
            last_message: lastMessage
        };
    }));

    // Sort by updated_at
    return conversations.sort((a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
}

export async function getMessages(conversationId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('direct_messages')
        .select('*, sender:profiles(*)')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error("Error fetching messages:", error);
        return [];
    }

    return data as DirectMessage[];
}

export async function sendMessage(conversationId: string, content: string, attachments: any = []) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase
        .from('direct_messages')
        .insert({
            conversation_id: conversationId,
            sender_id: user.id,
            content,
            attachments
        })
        .select()
        .single();

    if (error) {
        console.error("Error sending message:", error);
        throw new Error("Failed to send message");
    }

    // Update conversation's updated_at
    await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

    return data;
}

export async function getOrCreateConversation(targetUserId: string) {
    const supabase = await createClient();

    // Call the RPC function
    const { data, error } = await supabase.rpc('get_or_create_conversation', {
        target_user_id: targetUserId
    });

    if (error) {
        console.error("Error with get_or_create_conversation RPC:", error);
        throw new Error("Failed to get or create conversation");
    }

    return data as string; // returns conversation_id
}

export async function markAsRead(conversationId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);
}

export async function uploadFile(file: File, conversationId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${conversationId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('chat_attachments')
        .upload(filePath, file);

    if (uploadError) {
        // If bucket doesn't exist, we might get an error.
        // In a real app we'd ensure it exists via migration or dashboard.
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
