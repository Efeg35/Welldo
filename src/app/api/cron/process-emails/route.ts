
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        const now = new Date().toISOString();

        // 1. Fetch pending schedules that are due
        const { data: schedules, error } = await supabase
            .from('event_email_schedules')
            .select('*, event:events(title, start_time, location_address, event_type, community:communities(name))')
            .eq('status', 'pending')
            .lte('scheduled_at', now)
            .limit(10); // Batch size to avoid timeouts

        if (error) throw error;
        if (!schedules || schedules.length === 0) {
            return NextResponse.json({ message: 'No emails to process' });
        }

        const results = [];

        for (const schedule of schedules) {
            try {
                // Determine Audience
                let recipientUserIds: string[] = [];

                if (schedule.audience === 'all') {
                    // All community members? Or all event interactions? 
                    // Usually "All" in this context implies "Everyone invited or going" or "Community Members"
                    // Let's assume "Going + Invited" for now to be safe, or just "Going" if invited logic isn't fully there.
                    // Implementation: Fetch 'going' (tickets/responses)
                    const { data: attendees } = await supabase.from('tickets').select('user_id').eq('event_id', schedule.event_id);
                    recipientUserIds = attendees?.map(a => a.user_id) || [];
                } else {
                    // 'going'
                    const { data: attendees } = await supabase.from('tickets').select('user_id').eq('event_id', schedule.event_id);
                    recipientUserIds = attendees?.map(a => a.user_id) || [];
                }

                // If no recipients, mark as sent/skipped
                if (recipientUserIds.length === 0) {
                    await supabase.from('event_email_schedules').update({ status: 'sent', updated_at: new Date().toISOString() }).eq('id', schedule.id);
                    results.push({ id: schedule.id, status: 'skipped_no_recipients' });
                    continue;
                }

                // Fetch emails
                const { data: users } = await supabase
                    .from('profiles')
                    .select('email, full_name')
                    .in('id', recipientUserIds);

                const validRecipients = users?.filter(u => u.email) || [];

                // Replace Variables in Content
                // {{event.name}}, {{event.date}}, {{event.time}}, {{event.location}}
                const event = schedule.event as any;
                const eventDate = new Date(event.start_time).toLocaleDateString('tr-TR');
                const eventTime = new Date(event.start_time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

                let populatedContent = schedule.content
                    .replace(/{{event.name}}/g, event.title)
                    .replace(/{{event.date}}/g, eventDate)
                    .replace(/{{event.time}}/g, eventTime)
                    .replace(/{{event.location}}/g, event.location_address || 'Online');

                let populatedSubject = schedule.subject.replace(/{{event.name}}/g, event.title);

                // Send Emails
                await Promise.all(validRecipients.map(recipient =>
                    sendEmail({
                        to: recipient.email!,
                        subject: populatedSubject,
                        html: `
                            <div style="font-family: sans-serif; white-space: pre-wrap;">
                                ${populatedContent}
                            </div>
                            <hr/>
                            <p style="font-size: 12px; color: gray;">${event.community?.name} tarafından gönderildi.</p>
                        `
                    })
                ));

                // Mark as sent
                await supabase.from('event_email_schedules').update({ status: 'sent', updated_at: new Date().toISOString() }).eq('id', schedule.id);
                results.push({ id: schedule.id, status: 'sent', recipient_count: validRecipients.length });

            } catch (err: any) {
                console.error(`Failed to process schedule ${schedule.id}:`, err);
                await supabase.from('event_email_schedules').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', schedule.id);
                results.push({ id: schedule.id, status: 'failed', error: err.message });
            }
        }


        // 2. Process Standard Reminders (System Toggles)
        await processStandardReminders(supabase, new Date(), results);

        return NextResponse.json({ success: true, processed: results });

    } catch (error: any) {
        console.error('Cron error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

async function processStandardReminders(supabase: any, now: Date, results: any[]) {
    // 1. EMAIL REMINDERS (1 Hour Before)
    // Range: 55m to 65m from now
    const oneHourFromNowStart = new Date(now.getTime() + 55 * 60000);
    const oneHourFromNowEnd = new Date(now.getTime() + 65 * 60000);

    const { data: upcomingEmailEvents } = await supabase
        .from('events')
        .select('*, community:communities(name)')
        .gte('start_time', oneHourFromNowStart.toISOString())
        .lte('start_time', oneHourFromNowEnd.toISOString());

    if (upcomingEmailEvents) {
        for (const event of upcomingEmailEvents) {
            const settings = event.settings as any;
            // Check if enabled and NOT sent
            if (settings?.reminders?.email_enabled && !settings?.reminders?.system_email_sent) {
                // Fetch Attendees
                const { data: attendees } = await supabase.from('tickets').select('user_id').eq('event_id', event.id);
                const userIds = attendees?.map((a: any) => a.user_id) || [];

                if (userIds.length > 0) {
                    const { data: users } = await supabase.from('profiles').select('email').in('id', userIds);
                    const recipients = users?.map((u: any) => u.email).filter(Boolean) || [];

                    // Send Email
                    const { sendEmail } = await import('@/lib/email');
                    await Promise.all(recipients.map((email: string) =>
                        sendEmail({
                            to: email,
                            subject: `🔔 Hatırlatma: ${event.title} 1 saat içinde başlıyor`,
                            html: `
                                <p>Merhaba,</p>
                                <p><strong>${event.title}</strong> etkinliği yaklaşık 1 saat içinde başlayacak.</p>
                                <p>Hazırlıklarını yapmayı unutma!</p>
                                <hr/>
                                <a href="${process.env.NEXT_PUBLIC_APP_URL}/events/${event.id}">Etkinliğe Git</a>
                            `
                        })
                    ));
                    results.push({ type: 'system_email_reminder', eventId: event.id, count: recipients.length });
                }

                // Mark as sent
                const newSettings = {
                    ...settings,
                    reminders: { ...settings.reminders, system_email_sent: true }
                };
                await supabase.from('events').update({ settings: newSettings }).eq('id', event.id);
            }
        }
    }

    // 2. IN-APP REMINDERS (15 Minutes Before)
    // Range: 10m to 20m from now
    const fifteenMinFromNowStart = new Date(now.getTime() + 10 * 60000);
    const fifteenMinFromNowEnd = new Date(now.getTime() + 20 * 60000);

    const { data: upcomingInAppEvents } = await supabase
        .from('events')
        .select('*, community:communities(name)')
        .gte('start_time', fifteenMinFromNowStart.toISOString())
        .lte('start_time', fifteenMinFromNowEnd.toISOString());

    if (upcomingInAppEvents) {
        for (const event of upcomingInAppEvents) {
            const settings = event.settings as any;
            if (settings?.reminders?.in_app_enabled && !settings?.reminders?.system_in_app_sent) {
                // Fetch Attendees
                const { data: attendees } = await supabase.from('tickets').select('user_id').eq('event_id', event.id);
                const userIds = attendees?.map((a: any) => a.user_id) || [];

                if (userIds.length > 0) {
                    const notifications = userIds.map((uid: string) => ({
                        user_id: uid,
                        actor_id: null, // System
                        type: 'event_reminder',
                        resource_id: event.id,
                        resource_type: 'event',
                        is_read: false
                    }));

                    await supabase.from('notifications').insert(notifications);
                    results.push({ type: 'system_in_app_reminder', eventId: event.id, count: userIds.length });
                }

                // Mark as sent
                const newSettings = {
                    ...settings,
                    reminders: { ...settings.reminders, system_in_app_sent: true }
                };
                await supabase.from('events').update({ settings: newSettings }).eq('id', event.id);
            }
        }
    }
}
