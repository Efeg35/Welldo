import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailOptions {
    to: string | string[];
    subject: string;
    html: string;
    replyTo?: string;
}

export async function sendEmail({ to, subject, html, replyTo }: SendEmailOptions) {
    try {
        const { data, error } = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'WellDo <onboarding@resend.dev>',
            to: Array.isArray(to) ? to : [to],
            subject,
            html,
            replyTo,
        });

        if (error) {
            console.error('Email send error:', error);
            throw new Error(error.message);
        }

        return data;
    } catch (error) {
        console.error('Email service error:', error);
        throw error;
    }
}

// Batch email sending for announcements
export async function sendBulkEmails(
    recipients: { email: string; name?: string }[],
    subject: string,
    htmlTemplate: (name?: string) => string
) {
    const results = await Promise.allSettled(
        recipients.map(recipient =>
            sendEmail({
                to: recipient.email,
                subject,
                html: htmlTemplate(recipient.name),
            })
        )
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return { successful, failed, total: recipients.length };
}
