"use client";

import { QRCodeSVG } from "qrcode.react";

interface TicketQRCodeProps {
    token: string;
    eventTitle: string;
}

export function TicketQRCode({ token, eventTitle }: TicketQRCodeProps) {
    return (
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-card p-6 text-center">
            <h3 className="font-semibold">Bilet QR Kodu</h3>
            <div className="rounded-xl bg-white p-4">
                <QRCodeSVG
                    value={token}
                    size={180}
                    level="H"
                    includeMargin={false}
                    bgColor="#ffffff"
                    fgColor="#0a0a0a"
                />
            </div>
            <div>
                <p className="text-sm font-medium">{eventTitle}</p>
                <p className="text-xs text-muted-foreground">
                    Etkinliğe girişte bu kodu gösterin
                </p>
            </div>
        </div>
    );
}
