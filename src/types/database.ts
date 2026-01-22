// Database Types for WellDo

export type UserRole = "member" | "instructor" | "admin";
export type EventType = "online_zoom" | "physical";
export type MembershipStatus = "active" | "cancelled" | "past_due";
export type ChannelType = "post" | "chat" | "event" | "course";

export interface Profile {
    id: string;
    email: string | null;
    full_name: string | null;
    avatar_url: string | null;
    role: UserRole;
    iyzico_sub_merchant_key: string | null;
    bio: string | null;
    created_at: string;
    updated_at: string;
}

export interface Community {
    id: string;
    owner_id: string;
    name: string;
    slug: string;
    description: string | null;
    cover_image_url: string | null;
    subscription_price: number;
    is_public: boolean;
    created_at: string;
    updated_at: string;
    // Joined fields
    owner?: Profile;
    member_count?: number;
}

export interface Channel {
    id: string;
    community_id: string;
    name: string;
    slug: string;
    description: string | null;
    type: ChannelType;
    icon: string | null;
    is_default: boolean;
    settings: Record<string, any> | null;
    created_at: string;
}

export interface Message {
    id: string;
    channel_id: string;
    user_id: string;
    content: string;
    created_at: string;
    // Joined fields
    user?: Profile;
}

export interface Membership {
    id: string;
    user_id: string;
    community_id: string;
    status: MembershipStatus;
    iyzico_subscription_ref: string | null;
    expires_at: string | null;
    created_at: string;
    // Joined fields
    community?: Community;
}

export interface Event {
    id: string;
    community_id: string;
    channel_id: string;
    title: string;
    description: string | null;
    event_type: EventType;
    location_address: string | null;
    zoom_meeting_id: string | null;
    zoom_password: string | null;
    start_time: string;
    end_time: string;
    ticket_price: number;
    max_attendees: number | null;
    cover_image_url: string | null;
    is_paid: boolean;
    topics: string[] | null;
    created_at: string;
    updated_at: string;
    // Joined fields
    community?: Community;
    ticket_count?: number;
}

export interface Post {
    id: string;
    community_id: string;
    channel_id: string | null;
    user_id: string;
    title: string | null;
    content: string;
    image_url?: string | null; // Added based on PostCard usage and createPost action
    media_urls: string[] | null;
    created_at: string;
    updated_at: string;
    // Joined fields
    post_likes?: { user_id: string }[];
    _count?: { post_likes: number; comments: number };
    comments?: { count: number }[];
    profiles?: Profile;
    channel?: Channel;
    community?: Community;
}

export interface Ticket {
    id: string;
    event_id: string;
    user_id: string;
    qr_code_token: string;
    checked_in: boolean;
    checked_in_at: string | null;
    iyzico_payment_id: string | null;
    created_at: string;
    // Joined fields
    event?: Event;
    user?: Profile;
}

export interface Gamification {
    id: string;
    user_id: string;
    community_id: string;
    points: number;
    level: number;
    updated_at: string;
}

export interface Course {
    id: string;
    channel_id: string;
    title: string;
    description: string | null;
    thumbnail_url: string | null;
    status: 'draft' | 'published' | 'archived';
    slug: string;
    created_at: string;
    updated_at: string;
    // Joined
    modules?: CourseModule[];
    channel?: Channel;
}

export interface CourseModule {
    id: string;
    course_id: string;
    title: string;
    description: string | null;
    order: number;
    drip_delay_days: number;
    release_at: string | null;
    created_at: string;
    // Joined
    lessons?: CourseLesson[];
}

export interface CourseLesson {
    id: string;
    module_id: string;
    title: string;
    content: string | null;
    video_url: string | null;
    attachments: any[] | null; // JSONB
    is_free: boolean;
    status: 'draft' | 'published';
    order: number;
    settings: {
        enable_featured_media: boolean;
        enable_comments: boolean;
        enforce_video_completion: boolean;
        auto_advance: boolean;
    } | null;
    created_at: string;
}

export interface UserCourseProgress {
    id: string;
    user_id: string;
    course_id: string;
    lesson_id: string;
    completed_at: string;
}
