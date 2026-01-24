import { Profile } from "./database";

export interface Conversation {
    id: string;
    created_at: string;
    updated_at: string;
    // Joined fields
    participants?: ConversationParticipant[];
    other_participant?: Profile;
    last_message?: DirectMessage;
    unread_count?: number;
}

export interface ConversationParticipant {
    conversation_id: string;
    user_id: string;
    last_read_at: string;
    created_at: string;
    // Joined
    profile?: Profile;
}

export interface DirectMessage {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    attachments: any; // JSONB
    created_at: string;
    // Joined
    sender?: Profile;
}
