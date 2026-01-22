"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createEvent(data: {
    communityId: string;
    channelId: string;
    title: string;
    description?: string;
    eventType: 'online_zoom' | 'physical';
    locationAddress?: string;
    startTime: Date;
    endTime: Date;
    coverImageUrl?: string;
    isPaid?: boolean;
    ticketPrice?: number;
    topics?: string[];
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const { error, data: event } = await supabase
        .from('events')
        .insert({
            community_id: data.communityId,
            channel_id: data.channelId,
            title: data.title,
            description: data.description,
            event_type: data.eventType,
            location_address: data.locationAddress,
            start_time: data.startTime.toISOString(),
            end_time: data.endTime.toISOString(),
            cover_image_url: data.coverImageUrl,
            is_paid: data.isPaid || false,
            ticket_price: data.ticketPrice || 0,
            topics: data.topics || [],
            // Default max_attendees to null (unlimited) for now
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating event:", error);
        throw new Error(`Failed to create event: ${error.message}`);
    }

    revalidatePath(`/community`);
    return event;
}

export async function getEvents(channelId: string, filter: 'upcoming' | 'past' = 'upcoming') {
    const supabase = await createClient();
    const now = new Date().toISOString();

    let query = supabase
        .from('events')
        .select('*')
        .eq('channel_id', channelId);

    if (filter === 'upcoming') {
        query = query.gte('start_time', now).order('start_time', { ascending: true });
    } else {
        query = query.lt('start_time', now).order('start_time', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching events:", error);
        return [];
    }

    return data;
}
