import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface EventConfirmationEmailProps {
    userName: string;
    eventTitle: string;
    eventDate: Date;
    eventEndDate: Date;
    eventType: 'online_zoom' | 'physical' | 'tbd' | 'welldo_live';
    location?: string;
    zoomLink?: string;
    communityName: string;
}

export function generateEventConfirmationEmail({
    userName,
    eventTitle,
    eventDate,
    eventEndDate,
    eventType,
    location,
    zoomLink,
    communityName,
}: EventConfirmationEmailProps): string {
    const formattedDate = format(eventDate, "d MMMM yyyy, EEEE", { locale: tr });
    const formattedTime = `${format(eventDate, 'HH:mm')} - ${format(eventEndDate, 'HH:mm')}`;

    const locationInfo = eventType === 'online_zoom' || eventType === 'welldo_live'
        ? `<p style="margin: 0; color: #3b82f6;">🎥 Online Etkinlik</p>`
        : `<p style="margin: 0;">📍 ${location || 'Konum belirtilmedi'}</p>`;

    const joinButton = (eventType === 'online_zoom' && zoomLink)
        ? `<a href="${zoomLink}" style="display: inline-block; background: #1c1c1c; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">Toplantıya Katıl</a>`
        : '';

    // Generate Google Calendar link
    const calendarStart = format(eventDate, "yyyyMMdd'T'HHmmss");
    const calendarEnd = format(eventEndDate, "yyyyMMdd'T'HHmmss");
    const calendarTitle = encodeURIComponent(eventTitle);
    const calendarDetails = encodeURIComponent(`${communityName} etkinliği`);
    const calendarLocation = encodeURIComponent(location || 'Online');
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${calendarTitle}&dates=${calendarStart}/${calendarEnd}&details=${calendarDetails}&location=${calendarLocation}`;

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
            <div style="background: linear-gradient(135deg, #1c1c1c 0%, #2d2d2d 100%); padding: 32px; text-align: center;">
                <div style="display: inline-block; background: #22c55e; color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600;">
                    ✓ Kayıt Onaylandı
                </div>
                <h1 style="color: white; margin: 16px 0 0; font-size: 24px; font-weight: 700;">
                    ${eventTitle}
                </h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 32px;">
                <p style="margin: 0 0 24px; color: #374151; font-size: 16px;">
                    Merhaba <strong>${userName}</strong>,
                </p>
                <p style="margin: 0 0 24px; color: #374151; font-size: 16px;">
                    <strong>${communityName}</strong> topluluğundaki etkinliğe kaydınız başarıyla tamamlandı!
                </p>
                
                <!-- Event Details Card -->
                <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                    <div style="margin-bottom: 16px;">
                        <p style="margin: 0 0 4px; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Tarih & Saat</p>
                        <p style="margin: 0; color: #111827; font-size: 16px; font-weight: 600;">
                            📅 ${formattedDate}
                        </p>
                        <p style="margin: 4px 0 0; color: #374151; font-size: 14px;">
                            🕐 ${formattedTime}
                        </p>
                    </div>
                    <div>
                        <p style="margin: 0 0 4px; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Konum</p>
                        ${locationInfo}
                    </div>
                </div>
                
                <!-- Action Buttons -->
                <div style="text-align: center;">
                    ${joinButton}
                    <a href="${googleCalendarUrl}" style="display: inline-block; background: white; color: #1c1c1c; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 12px; border: 2px solid #e5e7eb;">
                        📆 Takvime Ekle
                    </a>
                </div>
            </div>
            
            <!-- Footer -->
            <div style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0; color: #6b7280; font-size: 14px;">
                    Etkinlik hakkında sorularınız mı var? Topluluk sayfasından iletişime geçebilirsiniz.
                </p>
                <p style="margin: 16px 0 0; color: #9ca3af; font-size: 12px;">
                    Bu e-posta WellDo tarafından gönderilmiştir.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
    `.trim();
}
