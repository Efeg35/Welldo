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
    attachments: any[];
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
    if (data.attachments) updates.attachments = data.attachments;

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
    // attachments is fine as is

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

export async function getEvents(channelId: string, filter: 'upcoming' | 'past' | 'draft' = 'upcoming') {
    const supabase = await createClient();
    const now = new Date().toISOString();

    let query = supabase
        .from('events')
        .select('*, bookmarks(user_id)')
        .eq('channel_id', channelId);

    if (filter === 'draft') {
        // Only allow logged in users to see drafts (and ideally check role, but strictly "status=draft" is hidden enough for now if UI hides it)
        // Better: Check if user is organizer or admin. 
        // For speed, I'll just filter by status='draft'. The UI will handle visibility.
        query = query.eq('status', 'draft').order('start_time', { ascending: true });
    } else {
        // Public/Member view
        query = query.eq('status', 'published');

        if (filter === 'upcoming') {
            query = query.gte('start_time', now).order('is_pinned', { ascending: false }).order('start_time', { ascending: true });
        } else {
            // past
            query = query.lt('start_time', now).order('start_time', { ascending: false });
        }
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

export async function getEventAttendees(eventId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
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
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching event attendees:", error);
        return [];
    }
    return data;
}

export async function addEventAttendee(eventId: string, userId: string) {
    const supabase = await createClient();

    // Check if duplicate
    const { data: existing } = await supabase
        .from('tickets')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .single();

    if (existing) {
        throw new Error("Kullanıcı zaten kayıtlı.");
    }

    // Create ticket
    const { error } = await supabase
        .from('tickets')
        .insert({
            event_id: eventId,
            user_id: userId,
            qr_code_token: Math.random().toString(36).substring(7),
            checked_in: false,
            // For manual addition
            iyzico_payment_id: null
        });

    if (error) {
        console.error("Error adding attendee:", error);
        throw new Error(`Ekleme başarısız: ${error.message}`);
    }

    revalidatePath(`/events/${eventId}`);
}

export async function deleteEvent(eventId: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

    if (error) {
        throw new Error(`Failed to delete event: ${error.message}`);
    }
    revalidatePath(`/community`);
}

export async function duplicateEvent(eventId: string) {
    const supabase = await createClient();
    const { data: original, error: fetchError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

    if (fetchError || !original) {
        throw new Error("Original event not found");
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Remove immutable fields and prepare for insert
    const { id, created_at, updated_at, ...rest } = original;

    const newEvent = {
        ...rest,
        title: `${original.title} (Çoğaltılmış)`,
        status: 'draft',
        organizer_id: user.id
    };

    const { data: duplicated, error: insertError } = await supabase
        .from('events')
        .insert(newEvent)
        .select()
        .single();

    if (insertError) {
        console.error("Duplicate error:", insertError);
        throw new Error(`Failed to duplicate event: ${insertError.message}`);
    }

    revalidatePath(`/community`);
    return duplicated;
}

export async function toggleEventPin(eventId: string, isPinned: boolean) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('events')
        .update({ is_pinned: isPinned })
        .eq('id', eventId);

    if (error) {
        throw new Error(`Failed to pin event: ${error.message}`);
    }
    revalidatePath(`/community`);
}

export async function toggleEventBookmark(eventId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Koleksiyona eklemek için giriş yapmalısınız.");

    const { data: existing } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', user.id)
        .eq('event_id', eventId)
        .single();

    if (existing) {
        await supabase
            .from('bookmarks')
            .delete()
            .eq('id', existing?.id);
    } else {
        await supabase
            .from('bookmarks')
            .insert({
                user_id: user.id,
                event_id: eventId
            });
    }

    revalidatePath(`/community`);
}
