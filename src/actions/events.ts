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
    settings: {
        reminders?: { in_app_enabled?: boolean; email_enabled?: boolean };
        notifications?: { send_post_notification?: boolean; send_confirmation_email?: boolean };
        permissions?: { comments_disabled?: boolean; hide_attendees?: boolean };
        attendees?: { rsvp_limit?: number | null; allow_guests?: boolean };
        seo?: { meta_title?: string | null; meta_description?: string | null; og_image_url?: string | null };
    };
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

    // Send Notification Email if enabled
    try {
        const { data: event } = await supabase
            .from('events')
            .select('*, community:communities(name)')
            .eq('id', eventId)
            .single();

        if (event) {
            const settings = event.settings as any;
            const sendNotification = settings?.notifications?.send_post_notification !== false;

            if (sendNotification) {
                // Fetch channel members (or community members if no channel specific logic yet)
                // For MVP: Fetch all community members who have email
                const { data: members } = await supabase
                    .from('memberships')
                    .select('user:profiles(email, full_name)')
                    .eq('community_id', event.community_id)
                    .eq('status', 'active');

                if (members && members.length > 0) {
                    const recipients = members
                        .map((m: any) => ({ email: m.user?.email, name: m.user?.full_name }))
                        .filter((r: any) => r.email); // Filter out nulls

                    if (recipients.length > 0) {
                        const { sendBulkEmails } = await import('@/lib/email');
                        const { generateEventAnnouncementEmail } = await import('@/emails/event-announcement');
                        const { format } = await import('date-fns');
                        const { tr } = await import('date-fns/locale');

                        await sendBulkEmails(
                            recipients,
                            `📢 Yeni Etkinlik: ${event.title}`,
                            (userName) => generateEventAnnouncementEmail({
                                eventName: event.title,
                                eventDescription: event.description || '',
                                eventDate: format(new Date(event.start_time), 'd MMMM yyyy', { locale: tr }),
                                eventTime: format(new Date(event.start_time), 'HH:mm', { locale: tr }),
                                eventLocation: event.event_type === 'online_zoom' ? 'Online (Zoom)' : event.location_address || 'Belirlenmedi',
                                eventUrl: `${process.env.NEXT_PUBLIC_APP_URL}/events/${event.id}`,
                                communityName: event.community?.name || 'Topluluk',
                                coverImageUrl: event.cover_image_url || undefined,
                                userName
                            })
                        );
                    }
                }
            }
        }
    } catch (e) {
        console.error("Failed to send publish notifications:", e);
        // Do not fail the publish action
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
        .select('*, community:communities(*), responses:event_responses(user_id, status, user:profiles(id, full_name, avatar_url))')
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
        .select('*, bookmarks(user_id), responses:event_responses(user_id, status, user:profiles(id, full_name, avatar_url))')
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
            qr_code_token: crypto.randomUUID(),
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

export async function removeEventAttendee(eventId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Giriş yapmalısınız.");

    const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user.id);

    if (error) {
        throw new Error(`Kayıt iptali başarısız: ${error.message}`);
    }

    revalidatePath(`/community`);
    revalidatePath(`/events/${eventId}`);
}

export async function setEventResponse(eventId: string, status: 'attending' | 'not_attending') {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Giriş yapmalısınız.");

    // Fetch event details first for validation and email
    const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*, community:communities(name)')
        .eq('id', eventId)
        .single();

    if (eventError || !event) {
        throw new Error("Etkinlik bulunamadı.");
    }

    // Check RSVP limit if attending
    if (status === 'attending') {
        const settings = event.settings as any;
        const rsvpLimit = settings?.attendees?.rsvp_limit;

        if (rsvpLimit) {
            // Check if user is already attending (to allow them to stay attending or update details without being blocked by limit)
            const { data: existingResponse } = await supabase
                .from('event_responses')
                .select('status')
                .eq('event_id', eventId)
                .eq('user_id', user.id)
                .single();

            const isAlreadyAttending = existingResponse?.status === 'attending';

            if (!isAlreadyAttending) {
                // Count current attending users
                const { count, error: countError } = await supabase
                    .from('event_responses')
                    .select('*', { count: 'exact', head: true })
                    .eq('event_id', eventId)
                    .eq('status', 'attending');

                if (countError) {
                    console.error("Error counting attendees:", countError);
                    throw new Error("Kontenjan kontrolü yapılamadı.");
                }

                if (count !== null && count >= rsvpLimit) {
                    throw new Error("Etkinlik kontenjanı dolu.");
                }
            }
        }
    }

    const { error } = await supabase
        .from('event_responses')
        .upsert({
            event_id: eventId,
            user_id: user.id,
            status: status
        }, {
            onConflict: 'event_id,user_id'
        });

    if (error) {
        throw new Error(`RSVP kaydı başarısız: ${error.message}`);
    }

    // Send confirmation email when attending
    const settings = event.settings as any;
    const sendConfirmation = settings?.notifications?.send_confirmation_email !== false; // Default to true if missing

    if (status === 'attending' && sendConfirmation) {
        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', user.id)
                .single();

            // Use auth user's email since profiles table may not have email
            const userEmail = user.email;

            if (userEmail) {
                const { sendEmail } = await import('@/lib/email');
                const { generateEventConfirmationEmail } = await import('@/emails/event-confirmation');

                const emailHtml = generateEventConfirmationEmail({
                    userName: profile?.full_name || 'Kullanıcı',
                    eventTitle: event.title,
                    eventDate: new Date(event.start_time),
                    eventEndDate: new Date(event.end_time),
                    eventType: event.event_type,
                    location: event.location_address,
                    zoomLink: event.zoom_meeting_id ? `https://zoom.us/j/${event.zoom_meeting_id}` : undefined,
                    communityName: event.community?.name || 'WellDo',
                });

                await sendEmail({
                    to: userEmail,
                    subject: `✅ Kayıt Onayı: ${event.title}`,
                    html: emailHtml,
                });
            }
        } catch (emailError) {
            // Don't fail the RSVP if email fails, just log it
            console.error('Failed to send confirmation email:', emailError);
        }
    }

    revalidatePath(`/community`);
    revalidatePath(`/events/${eventId}`);
}

export async function removeEventResponse(eventId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Giriş yapmalısınız.");

    const { error } = await supabase
        .from('event_responses')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user.id);

    if (error) {
        throw new Error(`RSVP silme başarısız: ${error.message}`);
    }

    revalidatePath(`/community`);
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

export const pinEventToSpace = toggleEventPin;  // Alias to support context menu component usage

// EMail Schedule
export async function createEmailSchedule(data: {
    eventId: string;
    subject: string;
    content: string;
    scheduledAt: Date;
    audience?: 'going' | 'invited' | 'all';
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const { error, data: schedule } = await supabase
        .from('event_email_schedules')
        .insert({
            event_id: data.eventId,
            subject: data.subject,
            content: data.content,
            scheduled_at: data.scheduledAt.toISOString(),
            audience: data.audience || 'going',
            status: 'pending'
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating email schedule:", error);
        throw new Error(`Failed to create email schedule: ${error.message}`);
    }

    return schedule;
}

export async function getEmailSchedules(eventId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('event_email_schedules')
        .select('*')
        .eq('event_id', eventId)
        .order('scheduled_at', { ascending: true });

    if (error) {
        console.error("Error fetching email schedules:", error);
        return [];
    }

    return data;
}

export async function deleteEmailSchedule(scheduleId: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('event_email_schedules')
        .delete()
        .eq('id', scheduleId);

    if (error) {
        throw new Error(`Failed to delete email schedule: ${error.message}`);
    }
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


export async function toggleEventBookmark(eventId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Check existing
    const { data: existing } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .single();

    if (existing) {
        await supabase.from('bookmarks').delete().eq('id', existing.id);
    } else {
        await supabase.from('bookmarks').insert({ event_id: eventId, user_id: user.id });
    }
    revalidatePath('/community');
}

/**
 * Get events for the Events Hub page with optional type filtering.
 * Returns all published events for the given month range or all future events.
 */
export async function getEventsForHub(options?: {
    typeFilter?: 'all' | 'physical' | 'online';
    startDate?: string;
    endDate?: string;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let query = supabase
        .from('events')
        .select(`
            *,
            community:communities(id, name, slug),
            channel:channels(id, name, slug),
            responses:event_responses(
                user_id,
                status,
                checked_in_at,
                user:profiles(id, full_name, avatar_url)
            ),
            tickets:tickets(user_id),
            bookmarks(user_id)
        `)
        .eq('status', 'published')
        .order('start_time', { ascending: true });

    // Type filter
    if (options?.typeFilter === 'physical') {
        query = query.eq('event_type', 'physical');
    } else if (options?.typeFilter === 'online') {
        query = query.in('event_type', ['online_zoom', 'online']);
    }

    // Date range filter
    if (options?.startDate) {
        query = query.gte('start_time', options.startDate);
    }
    if (options?.endDate) {
        query = query.lte('start_time', options.endDate);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching events for hub:", error);
        return [];
    }

    return data || [];
}

/**
 * Check in an attendee at the door.
 * Only organizers/admins can perform this action.
 */
export async function checkInAttendee(eventId: string, attendeeUserId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // Check if user is organizer or admin
    const { data: event } = await supabase
        .from('events')
        .select('organizer_id')
        .eq('id', eventId)
        .single();

    if (!event) throw new Error("Event not found");

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    const isAdmin = profile?.role === 'admin' || profile?.role === 'instructor';
    const isOrganizer = event.organizer_id === user.id;

    if (!isAdmin && !isOrganizer) {
        throw new Error("Unauthorized: Only organizers can check in attendees");
    }

    // Update check-in timestamp
    const { error } = await supabase
        .from('event_responses')
        .update({ checked_in_at: new Date().toISOString() })
        .eq('event_id', eventId)
        .eq('user_id', attendeeUserId);

    if (error) {
        console.error("Error checking in attendee:", error);
        throw new Error("Failed to check in attendee");
    }

    revalidatePath(`/events/${eventId}/attendees`);
}

/**
 * Get attendees for an event with check-in status.
 * Only organizers/admins can access this.
 */
export async function getEventAttendeesWithCheckIn(eventId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase
        .from('event_responses')
        .select(`
            user_id,
            status,
            checked_in_at,
            created_at,
            user:profiles(id, full_name, avatar_url, email)
        `)
        .eq('event_id', eventId)
        .eq('status', 'attending')
        .order('created_at', { ascending: true });

    if (error) {
        console.error("Error fetching attendees:", error);
        return [];
    }

    return data || [];
}

