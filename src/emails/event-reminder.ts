import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface EventReminderEmailProps {
    userName: string;
    eventTitle: string;
    eventDate: Date;
    eventType: 'online_zoom' | 'physical' | 'tbd' | 'welldo_live';
    location?: string;
    zoomLink?: string;
    communityName: string;
}

export function generateEventReminderEmail({
    userName,
    eventTitle,
    eventDate,
    eventType,
    location,
    zoomLink,
    communityName,
}: EventReminderEmailProps): string {
    const formattedTime = format(eventDate, 'HH:mm');

    const joinButton = (eventType === 'online_zoom' && zoomLink)
        ? `<a href="${zoomLink}" style="display: inline-block; background: #22c55e; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px;">🎥 Şimdi Katıl</a>`
        : eventType === 'physical'
            ? `<p style="margin: 0; padding: 16px; background: #fef3c7; border-radius: 8px; color: #92400e;">📍 ${location || 'Belirtilen konuma'} gitmeyi unutmayın!</p>`
            : '';

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 32px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 16px;">⏰</div>
                <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">
                    1 Saat Kaldı!
                </h1>
                <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 16px;">
                    ${eventTitle}
                </p>
            </div>
            
            <!-- Content -->
            <div style="padding: 32px; text-align: center;">
                <p style="margin: 0 0 24px; color: #374151; font-size: 16px;">
                    Merhaba <strong>${userName}</strong>,
                </p>
                <p style="margin: 0 0 24px; color: #374151; font-size: 18px;">
                    <strong>${communityName}</strong> etkinliğiniz <strong style="color: #f59e0b;">${formattedTime}</strong>'de başlıyor!
                </p>
                
                ${joinButton}
            </div>
            
            <!-- Footer -->
            <div style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                    Bu hatırlatma, etkinliğe kayıt olduğunuz için gönderilmiştir.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
    `.trim();
}
