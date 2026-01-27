// Database Types for WellDo

export type UserRole = "member" | "instructor" | "admin";
export type EventStatus = "draft" | "published" | "archived";
export type EventType = "online_zoom" | "physical" | "tbd" | "welldo_live";
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
    category: string;
    access_level: 'open' | 'private' | 'secret';
    settings: Record<string, any> | null;
    position: number;
    created_at: string;
    // New fields
    group_id?: string | null;
    // Joined fields
    group?: ChannelGroup | null;
}

export interface ChannelGroup {
    id: string;
    community_id: string;
    name: string;
    slug: string;
    position: number;
    settings: Record<string, any> | null;
    created_at: string;
    // Joined
    channels?: Channel[];
}

export interface Message {
    id: string;
    channel_id: string;
    user_id: string;
    content: string;
    attachments?: any[] | null;
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
    status: EventStatus;
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
    attachments?: any[] | null;
    recurrence?: string | null;
    organizer_id?: string | null;
    created_at: string;
    updated_at: string;
    is_pinned: boolean;
    // Joined fields
    community?: Community;
    ticket_count?: number;
    bookmarks?: { user_id: string }[];
    bookmarked?: boolean;
    tickets?: { user_id: string }[];
    responses?: {
        user_id: string;
        status: 'attending' | 'not_attending';
        user: { id: string; full_name: string | null; avatar_url: string | null }
    }[];
    settings?: {
        reminders?: { in_app_enabled?: boolean; email_enabled?: boolean };
        notifications?: { send_post_notification?: boolean; send_confirmation_email?: boolean };
        permissions?: { comments_disabled?: boolean; hide_attendees?: boolean };
        attendees?: { rsvp_limit?: number | null; allow_guests?: boolean };
        seo?: { meta_title?: string | null; meta_description?: string | null; og_image_url?: string | null };
    };
}

export interface EventEmailSchedule {
    id: string;
    event_id: string;
    subject: string;
    content: string;
    scheduled_at: string;
    audience: 'going' | 'invited' | 'all';
    status: 'pending' | 'sent' | 'failed';
    created_at: string;
    updated_at: string;
}

export interface Post {
    id: string;
    community_id: string;
    channel_id: string | null;
    user_id: string;
    title: string | null;
    content: string;
    topic: string | null;
    image_url?: string | null; // Added based on PostCard usage and createPost action
    media_urls: string[] | null;
    created_at: string;
    updated_at: string;
    // Joined fields
    likes?: { user_id: string }[];
    bookmarks?: { user_id: string }[];
    _count?: { likes: number; comments: number };
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

export interface EventResponse {
    id: string;
    event_id: string;
    user_id: string;
    status: 'attending' | 'not_attending';
    created_at: string;
    updated_at: string;
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
    topics: string[] | null;
    created_at: string;
    updated_at: string;
    // Joined
    modules?: CourseModule[];
    channel?: Channel;
    paywalls?: Paywall[];
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
    content: string | QuizContent | null; // Supports markdown string or JSON QuizContent
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
        default_tab: 'comments' | 'curriculum' | 'files';
    } | null;
    created_at: string;
}

// --- Quiz Types ---

export interface QuizContent {
    type: 'quiz';
    settings: QuizSettings;
    questions: QuizQuestion[];
}

export interface QuizSettings {
    passing_grade: number; // 0-100
    is_enforced: boolean;
    show_answers: boolean;
}

export interface QuizQuestion {
    id: string;
    text: string;
    media_url?: string | null;
    media_type?: 'image' | 'video' | null;
    type: 'single_choice' | 'multiple_choice'; // Added multiple_choice for future proofing/completeness
    options: QuizOption[];
}

export interface QuizOption {
    id: string;
    text: string;
    isCorrect: boolean;
}

export interface UserCourseProgress {
    id: string;
    user_id: string;
    course_id: string;
    lesson_id: string;
    completed_at: string;
}

export interface Paywall {
    id: string;
    course_id: string;
    currency: string;
    price: number;
    created_at: string;
    updated_at: string;
}

export interface PaywallPurchase {
    id: string;
    paywall_id: string | null;
    user_id: string;
    payment_id: string;
    amount: number;
    created_at: string;
}
