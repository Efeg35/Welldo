import { createClient } from "@/lib/supabase/server";
import { getEventsForHub } from "@/actions/events";
import { EventsHubClient } from "./events-hub-client";

export default async function EventsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Check if user is admin/instructor
    let isAdmin = false;
    let userProfile = null;
    let communityId = null;
    let channelId = null;

    if (user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        isAdmin = profile?.role === 'admin' || profile?.role === 'instructor';
        userProfile = profile;

        // Get default community and event channel for creating events
        const { data: community } = await supabase.from('communities').select('id').limit(1).single();
        if (community) {
            communityId = community.id;
            const { data: channel } = await supabase
                .from('channels')
                .select('id, access_level')
                .eq('community_id', community.id)
                .eq('type', 'event')
                .limit(1)
                .single();
            if (channel) {
                channelId = channel.id;
            }
        }
    }

    // Get the channel data
    let accessLevel: 'open' | 'private' | 'secret' | undefined;
    let channelSettings: any = null;
    if (channelId) {
        const { data: channelData } = await supabase.from('channels').select('access_level, settings').eq('id', channelId).single();
        accessLevel = channelData?.access_level;
        channelSettings = channelData?.settings;
    }

    // Fetch initial events (all types, future events)
    const events = await getEventsForHub({
        typeFilter: 'all',
        startDate: new Date().toISOString(),
    });

    return (
        <EventsHubClient
            initialEvents={events}
            isAdmin={isAdmin}
            userId={user?.id}
            userProfile={userProfile}
            communityId={communityId || undefined}
            channelId={channelId || undefined}
            accessLevel={accessLevel}
            initialSettings={channelSettings}
        />
    );
}
