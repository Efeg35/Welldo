import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateZoomSignature } from "@/lib/zoom/signature";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check auth
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { meetingNumber, role = 0 } = await request.json();

        if (!meetingNumber) {
            return NextResponse.json(
                { error: "Meeting number is required" },
                { status: 400 }
            );
        }

        const sdkKey = process.env.ZOOM_SDK_KEY;
        const sdkSecret = process.env.ZOOM_SDK_SECRET;

        if (!sdkKey || !sdkSecret) {
            return NextResponse.json(
                { error: "Zoom SDK credentials not configured" },
                { status: 500 }
            );
        }

        const signature = generateZoomSignature({
            sdkKey,
            sdkSecret,
            meetingNumber: String(meetingNumber),
            role: Number(role),
        });

        return NextResponse.json({
            signature,
            sdkKey,
        });
    } catch (error) {
        console.error("Zoom signature error:", error);
        return NextResponse.json(
            { error: "Failed to generate signature" },
            { status: 500 }
        );
    }
}
