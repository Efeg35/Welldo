"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { EventType } from "@/types";

export async function createEvent(data: {
    communityId: string;
    channelId: string;
    title: string;
    description?: string;
    eventType: EventType;
    locationAddress?: string;
    eventUrl?: string;
    liveStreamSettings?: {
        recordLive: boolean;
        muteParticipants: boolean;
        disableChat: boolean;
        hideParticipantsList: boolean;
    };
    startTime: Date;
    endTime: Date;
    coverImageUrl?: string;
    isPaid?: boolean;
    ticketPrice?: number;
    topics?: string[];
    recurrence?: string;
    status?: 'draft' | 'published';
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
            event_url: data.eventUrl,
            live_stream_settings: data.liveStreamSettings,
            start_time: data.startTime.toISOString(),
            end_time: data.endTime.toISOString(),
            cover_image_url: data.coverImageUrl,
            is_paid: data.isPaid || false,
            ticket_price: data.ticketPrice || 0,
            topics: data.topics || [],
            recurrence: data.recurrence || 'none',
            status: data.status || 'draft',
            organizer_id: user.id,
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

export async function updateEvent(eventId: string, data: Partial<{
    title: string;
    description: string;
    eventType: EventType;
    locationAddress: string;
    eventUrl: string;
    liveStreamSettings: any;
    startTime: Date;
    endTime: Date;
    coverImageUrl: string;
    isPaid: boolean;
    ticketPrice: number;
    recurrence: string;
    channelId: string;
}>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const updates: any = { ...data };
    if (data.startTime) updates.start_time = data.startTime.toISOString();
    if (data.endTime) updates.end_time = data.endTime.toISOString();
    if (data.eventType) updates.event_type = data.eventType;
    if (data.locationAddress) updates.location_address = data.locationAddress;
    if (data.eventUrl) updates.event_url = data.eventUrl;
    if (data.liveStreamSettings) updates.live_stream_settings = data.liveStreamSettings;
    if (data.coverImageUrl) updates.cover_image_url = data.coverImageUrl;
    if (data.isPaid !== undefined) updates.is_paid = data.isPaid;
    if (data.ticketPrice) updates.ticket_price = data.ticketPrice;
    if (data.channelId) updates.channel_id = data.channelId;

    // Remove camalCase keys mapped to snake_case
    delete updates.startTime;
    delete updates.endTime;
    delete updates.eventType;
    delete updates.locationAddress;
    delete updates.eventUrl;
    delete updates.liveStreamSettings;
    delete updates.coverImageUrl;
    delete updates.isPaid;
    delete updates.ticketPrice;
    delete updates.channelId;

    const { error, data: event } = await supabase
        .from('events')
        .update(updates)
        .eq('id', eventId)
        .select()
        .single();

    if (error) {
        console.error("Error updating event:", error);
        throw new Error(`Failed to update event: ${error.message}`);
    }

    revalidatePath(`/community`);
    return event;
}

export async function publishEvent(eventId: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('events')
        .update({ status: 'published' })
        .eq('id', eventId);

    if (error) {
        throw new Error(`Failed to publish event: ${error.message}`);
    }
    revalidatePath(`/community`);
}

export async function unpublishEvent(eventId: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('events')
        .update({ status: 'draft' })
        .eq('id', eventId);

    if (error) {
        throw new Error(`Failed to unpublish event: ${error.message}`);
    }
    revalidatePath(`/community`);
}

export async function getEvent(eventId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

    if (error) {
        console.error("Error fetching event:", error);
        return null;
    }
    return data;
}

export async function getEvents(channelId: string, filter: 'upcoming' | 'past' = 'upcoming') {
    const supabase = await createClient();
    const now = new Date().toISOString();

    let query = supabase
        .from('events')
        .select('*')
        .eq('channel_id', channelId)
        .eq('status', 'published'); // Only fetch published events

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

export async function getEventStats(eventId: string) {
    const supabase = await createClient();

    // Get ticket count
    const { count, error: countError } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId);

    if (countError) {
        console.error("Error fetching event stats count:", countError);
    }

    // Get latest attendees
    const { data: latestAttendees, error: attendeesError } = await supabase
        .from('tickets')
        .select(`
            id,
            created_at,
            user:profiles (
                id,
                full_name,
                avatar_url,
                email
            )
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
        .limit(10);

    if (attendeesError) {
        console.error("Error fetching latest attendees:", attendeesError);
    }

    return {
        attendeeCount: count || 0,
        latestAttendees: latestAttendees || []
    };
}
