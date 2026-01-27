
import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Html,
    Img,
    Link,
    Preview,
    Section,
    Text,
    Hr,
} from "@react-email/components";
import * as React from "react";

interface EventAnnouncementEmailProps {
    eventName: string;
    eventDescription: string;
    eventDate: string;
    eventTime: string;
    eventLocation: string;
    eventUrl: string;
    communityName: string;
    coverImageUrl?: string;
    userName?: string;
}

export const generateEventAnnouncementEmail = ({
    eventName,
    eventDescription,
    eventDate,
    eventTime,
    eventLocation,
    eventUrl,
    communityName,
    coverImageUrl,
    userName
}: EventAnnouncementEmailProps) => {
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style="background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          ${coverImageUrl ? `<img src="${coverImageUrl}" alt="${eventName}" style="width: 100%; height: 200px; object-fit: cover;" />` : ''}
          
          <div style="padding: 32px;">
            <h1 style="color: #111827; font-size: 24px; font-weight: 800; margin: 0 0 16px;">${eventName}</h1>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 24px;">
              Merhaba ${userName || 'Üye'},<br/><br/>
              <strong>${communityName}</strong> yeni bir etkinlik yayınladı! Seni aramızda görmekten mutluluk duyarız.
            </p>

            <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <table style="width: 100%;">
                <tr>
                  <td style="padding-bottom: 8px; color: #6b7280; font-size: 14px;">Tarih</td>
                  <td style="padding-bottom: 8px; color: #111827; font-weight: 600; font-size: 14px;">${eventDate}</td>
                </tr>
                <tr>
                  <td style="padding-bottom: 8px; color: #6b7280; font-size: 14px;">Saat</td>
                  <td style="padding-bottom: 8px; color: #111827; font-weight: 600; font-size: 14px;">${eventTime}</td>
                </tr>
                <tr>
                  <td style="color: #6b7280; font-size: 14px;">Konum</td>
                  <td style="color: #111827; font-weight: 600; font-size: 14px;">${eventLocation}</td>
                </tr>
              </table>
            </div>

            ${eventDescription ? `
              <div style="margin-bottom: 24px; color: #4b5563; font-size: 15px; line-height: 24px; border-left: 4px solid #e5e7eb; padding-left: 16px;">
                ${eventDescription.length > 200 ? eventDescription.substring(0, 200) + '...' : eventDescription}
              </div>
            ` : ''}

            <div style="text-align: center;">
              <a href="${eventUrl}" style="background-color: #000000; color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
                Etkinliğe Git
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0 24px;" />
            
            <p style="text-align: center; color: #9ca3af; font-size: 12px;">
              Bu e-postayı ${communityName} topluluğundaki üyelik tercihlerinize istinaden alıyorsunuz.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
};
