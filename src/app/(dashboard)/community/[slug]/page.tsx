
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { getPosts, getChannelBySlug } from "@/actions/community";
import { getEvents } from "@/actions/events";
import { PostFeed } from "@/components/community/post-feed";
import { EventFeed } from "@/components/community/event-feed";
import { ChatFeed } from "@/components/community/chat-feed";
import { CourseFeed } from "@/components/community/course-feed";
import { CourseBuilder } from "@/components/community/course-builder";
import { CoursePlayer } from "@/components/community/course-player";
import { getChannelMessages } from "@/actions/chat";
import { getCourse } from "@/actions/courses";
import { Profile, Message } from "@/types";

export default async function ChannelPage({ params, searchParams }: { params: { slug: string }, searchParams: { sort?: string, view?: string, lessonId?: string } }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Map Auth User to Profile interface
    const profile: Profile = {
        id: user.id || "",
        email: user.email || null,
        full_name: (user.user_metadata?.full_name as string) || null,
        avatar_url: (user.user_metadata?.avatar_url as string) || null,
        role: (user.user_metadata?.role as 'member' | 'instructor' | 'admin') || 'member',
        iyzico_sub_merchant_key: null,
        bio: null,
        created_at: user.created_at,
        updated_at: user.updated_at || user.created_at
    };

    const { slug } = await params;

    // Fetch Channel Details
    const channel = await getChannelBySlug(slug);

    if (!channel) {
        return notFound();
    }

    const { sort = 'latest' } = await searchParams;

    // Render based on channel type
    if (channel.type === 'event') {
        const events = await getEvents(channel.id, 'upcoming');
        return <EventFeed channel={channel} user={profile} initialEvents={events} />;
    }

    if (channel.type === 'chat') {
        const messages = await getChannelMessages(channel.id);
        return <ChatFeed channel={channel} user={profile} initialMessages={messages as Message[]} />;
    }

    if (channel.type === 'course') {
        const course = await getCourse(channel.id);
        const { view } = await searchParams;

        if (view === 'builder' && course) {
            return <CourseBuilder course={course} />;
        }

        return <CourseFeed channel={channel} user={profile} course={course} />;
    }

    // Default to Post Feed (for 'post' type or others)
    const posts = await getPosts(channel.id, sort);
    const communityId = channel.community_id;

    return <PostFeed channel={channel} user={profile} posts={posts} communityId={communityId} />;
}
