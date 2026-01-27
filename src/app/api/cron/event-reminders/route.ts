import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email';
import { generateEventReminderEmail } from '@/emails/event-reminder';

// Use service role for cron jobs
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const now = new Date();
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
        const oneHourFiveMinFromNow = new Date(now.getTime() + 65 * 60 * 1000);

        // Find events starting in roughly 1 hour (5 min window to avoid missing any)
        const { data: upcomingEvents, error: eventsError } = await supabase
            .from('events')
            .select(`
                id, title, start_time, end_time, event_type, location_address, zoom_meeting_id,
                community:communities(name),
                responses:event_responses(
                    user_id,
                    status,
                    user:profiles(id, full_name, email)
                )
            `)
            .eq('status', 'published')
            .gte('start_time', oneHourFromNow.toISOString())
            .lte('start_time', oneHourFiveMinFromNow.toISOString());

        if (eventsError) {
            console.error('Error fetching events:', eventsError);
            return NextResponse.json({ error: eventsError.message }, { status: 500 });
        }

        if (!upcomingEvents || upcomingEvents.length === 0) {
            return NextResponse.json({ message: 'No events to remind', count: 0 });
        }

        let emailsSent = 0;
        let emailsFailed = 0;

        for (const event of upcomingEvents) {
            // Only send to users who are 'attending'
            const attendees = (event.responses || [])
                .map((r: any) => ({
                    ...r,
                    user: Array.isArray(r.user) ? r.user[0] : r.user
                }))
                .filter((r: any) => r.status === 'attending' && r.user?.email);

            for (const attendee of attendees) {
                try {
                    const emailHtml = generateEventReminderEmail({
                        userName: attendee.user.full_name || 'Kullanıcı',
                        eventTitle: event.title,
                        eventDate: new Date(event.start_time),
                        eventType: event.event_type,
                        location: event.location_address,
                        zoomLink: event.zoom_meeting_id ? `https://zoom.us/j/${event.zoom_meeting_id}` : undefined,
                        communityName: (event.community as any)?.name || 'WellDo',
                    });

                    await sendEmail({
                        to: attendee.user.email,
                        subject: `⏰ 1 Saat Kaldı: ${event.title}`,
                        html: emailHtml,
                    });

                    emailsSent++;
                } catch (error) {
                    console.error(`Failed to send reminder to ${attendee.user?.email}:`, error);
                    emailsFailed++;
                }
            }
        }

        return NextResponse.json({
            message: 'Reminders sent',
            eventsProcessed: upcomingEvents.length,
            emailsSent,
            emailsFailed,
        });

    } catch (error) {
        console.error('Cron job error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
