
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { getPosts, getChannelBySlug } from "@/actions/community";
import { getEvents } from "@/actions/events";
import { PostFeed } from "@/components/community/post-feed";
import { EventFeed } from "@/components/community/event-feed";
import { ChatFeed } from "@/components/community/chat-feed";
import { CourseFeed } from "@/components/community/course-feed";

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

        // Check access via active enrollment
        const { data: enrollment } = await supabase
            .from('user_course_enrollments')
            .select('status')
            .eq('course_id', course?.id)
            .eq('user_id', user.id)
            .single();

        let isPurchased = enrollment?.status === 'active';

        // If no enrollment record exists yet, check if it's a free course (no paywall)
        // or if they have a successful purchase but no enrollment record (legacy fallback)
        if (!enrollment) {
            const hasPaywall = course?.paywalls && course.paywalls.length > 0;
            if (!hasPaywall) {
                isPurchased = true; // Free course
            } else {
                const { data: purchase } = await supabase
                    .from('paywall_purchases')
                    .select('id')
                    .eq('paywall_id', course.paywalls[0].id)
                    .eq('user_id', user.id)
                    .single();
                isPurchased = !!purchase;
            }
        }

        // Check if author
        const isAuthor = course?.channel?.community?.owner_id === user.id; // Just a guess, need to check data shape or logic
        // Actually, getCourse returns nested community owner?
        // Let's rely on course.channel.community.owner_id if available.
        // getCourse query:
        // modules:..., channel:channels(*, community:communities(*, owner:profiles(*))) NO, query is currently:
        /*
          .select(`
            *,
            modules:course_modules(
                *,
                lessons:course_lessons(*)
            ),
            paywalls(*)
        `)
       */
        // It does NOT fetch channel.community.owner.
        // But we have profile.id (current user).
        // We can check if profile.id is the community owner if we had community owner id.
        // 'channel' variable (fetched via getChannelBySlug) MIGHT have owner_id if getChannelBySlug joins it.
        // getChannelBySlug in actions/community.ts usually joins community?

        // Let's check getChannelBySlug or simply Assume channel.community_id is known.
        // We can fetch community owner separately or rely on checking if user is the instructor later.
        // For now, let's pass isPurchased status.

        // Also pass 'isAuthor' just in case.
        // 'channel' object has community_id.
        const { data: community } = await supabase
            .from('communities')
            .select('owner_id')
            .eq('id', channel.community_id)
            .single();

        const isInstructor = community?.owner_id === user.id;

        return <CourseFeed channel={channel} user={profile} course={course} isPurchased={isPurchased || isInstructor} />;
    }

    // Default to Post Feed (for 'post' type or others)
    const posts = await getPosts(channel.id, sort);
    const communityId = channel.community_id;

    return <PostFeed channel={channel} user={profile} posts={posts} communityId={communityId} />;
}
