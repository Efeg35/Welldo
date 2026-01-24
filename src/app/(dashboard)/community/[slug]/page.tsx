
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { getPosts, getChannelBySlug } from "@/actions/community";
import { getEvents } from "@/actions/events";
import { PostFeed } from "@/components/community/post-feed";
import { EventFeed } from "@/components/community/event-feed";
import { ChatFeed } from "@/components/community/chat-feed";
import { SpaceChat } from "@/components/community/space-chat";
import { CourseFeed } from "@/components/community/course-feed";

import { CoursePlayer } from "@/components/community/course-player";
import { getChannelMessages, getChannelMembers } from "@/actions/chat";
import { getCourse } from "@/actions/courses";
import { Profile, Message } from "@/types";
import { SpaceLockScreen } from "@/components/community/space-lock-screen";

export default async function ChannelPage({ params, searchParams }: { params: { slug: string }, searchParams: { sort?: string, view?: string, lessonId?: string } }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // 1. Fetch Full Profile from DB
    const { data: dbProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    // Map Auth User + DB Profile to Profile interface
    const profile: Profile = {
        id: user.id,
        email: user.email || dbProfile?.email || null,
        full_name: dbProfile?.full_name || (user.user_metadata?.full_name as string) || "Bilinmeyen",
        avatar_url: dbProfile?.avatar_url || (user.user_metadata?.avatar_url as string) || null,
        role: dbProfile?.role || (user.user_metadata?.role as any) || 'member',
        iyzico_sub_merchant_key: dbProfile?.iyzico_sub_merchant_key || null,
        bio: dbProfile?.bio || null,
        created_at: dbProfile?.created_at || user.created_at,
        updated_at: dbProfile?.updated_at || user.updated_at || user.created_at
    };

    const { slug } = await params;

    // 2. Fetch Channel Details
    const channel = await getChannelBySlug(slug);

    if (!channel) {
        return notFound();
    }

    // 3. Fetch Community Details to check ownership
    const { data: community } = await supabase
        .from('communities')
        .select('owner_id')
        .eq('id', channel.community_id)
        .single();

    const isOwner = profile.role === 'admin' || profile.role === 'instructor' || community?.owner_id === user.id;

    // Elevate role in the passed profile object if they are the owner but role says member
    if (community?.owner_id === user.id && profile.role === 'member') {
        profile.role = 'instructor';
    }

    // 1. Fetch Course Data early if it's a course to get its ID for enrollment check
    let course = null;
    if (channel.type === 'course') {
        course = await getCourse(channel.id);
    }

    // 2. Determine Access
    let hasAccess = isOwner || channel.access_level === 'open';

    if (!hasAccess) {
        // Check space members (generic)
        const { data: spaceMember } = await supabase
            .from('space_members')
            .select('id')
            .eq('channel_id', channel.id)
            .eq('user_id', user.id)
            .single();

        if (spaceMember) hasAccess = true;

        // Check course enrollments (specific to course)
        if (!hasAccess && channel.type === 'course' && course) {
            const { data: enrollment } = await supabase
                .from('user_course_enrollments')
                .select('status')
                .eq('course_id', course.id)
                .eq('user_id', user.id)
                .eq('status', 'active')
                .single();
            if (enrollment) hasAccess = true;
        }
    }

    // 3. ENFORCE ACCESS POLICY (Secret)
    if (!hasAccess && channel.access_level === 'secret') {
        return notFound();
    }

    const { sort = 'latest' } = await searchParams;

    // 4. Render based on channel type & access
    if (channel.type === 'event') {
        if (!hasAccess) return <SpaceLockScreen channel={channel} />;
        const events = await getEvents(channel.id, 'upcoming');
        return <EventFeed channel={channel} user={profile} initialEvents={events} />;
    }

    if (channel.type === 'chat') {
        if (!hasAccess) return <SpaceLockScreen channel={channel} />;
        const messages = await getChannelMessages(channel.id);
        const members = await getChannelMembers(channel.id);
        return <SpaceChat channel={channel} user={profile} initialMessages={messages as Message[]} members={members as unknown as Profile[]} />;
    }

    if (channel.type === 'course') {
        // CourseFeed handles its own internal "Lock Screen" (Paywall) if !hasAccess
        // But we already calculated hasAccess here based on enrollment/owner.
        // Let's pass it down.
        const { data: community } = await supabase
            .from('communities')
            .select('owner_id')
            .eq('id', channel.community_id)
            .single();

        const instructorStatus = community?.owner_id === user.id;

        return <CourseFeed channel={channel} user={profile} course={course} isPurchased={hasAccess || instructorStatus} isInstructor={instructorStatus} />;
    }

    // Default to Post Feed
    if (!hasAccess) return <SpaceLockScreen channel={channel} />;
    const posts = await getPosts(channel.id, sort);
    const communityId = channel.community_id;

    return <PostFeed channel={channel} user={profile} posts={posts} communityId={communityId} />;
}
