import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { retrievePaymentResult } from "@/lib/iyzico";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const token = formData.get("token") as string;

        if (!token) {
            return NextResponse.redirect(
                new URL("/payment/error?reason=no_token", request.url)
            );
        }

        const supabase = await createClient();

        // Verify payment with Iyzico
        const result = await retrievePaymentResult(token);

        if (!result.success) {
            // Delete pending ticket
            await supabase
                .from("tickets")
                .delete()
                .eq("iyzico_payment_id", token);

            return NextResponse.redirect(
                new URL(`/payment/error?reason=${encodeURIComponent(result.error || "payment_failed")}`, request.url)
            );
        }

        // Update ticket with real payment ID
        const { data: ticket } = await supabase
            .from("tickets")
            .update({ iyzico_payment_id: result.paymentId })
            .eq("iyzico_payment_id", token)
            .select("event_id")
            .single();

        if (ticket) {
            return NextResponse.redirect(
                new URL(`/events/${ticket.event_id}?payment=success`, request.url)
            );
        }

        return NextResponse.redirect(
            new URL("/payment/success", request.url)
        );
    } catch (error) {
        console.error("Payment callback error:", error);
        return NextResponse.redirect(
            new URL("/payment/error?reason=server_error", request.url)
        );
    }
}
