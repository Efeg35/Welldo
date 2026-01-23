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
            // Delete pending ticket or purchase
            await supabase
                .from("tickets")
                .delete()
                .eq("iyzico_payment_id", token);

            await supabase
                .from("paywall_purchases")
                .delete()
                .eq("payment_id", token);

            return NextResponse.redirect(
                new URL(`/payment/error?reason=${encodeURIComponent(result.error || "payment_failed")}`, request.url)
            );
        }

        // 1. Try to update Ticket
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

        // 2. Try to update Course Purchase
        const { data: purchase } = await supabase
            .from("paywall_purchases")
            .update({ payment_id: result.paymentId })
            .eq("payment_id", token)
            .select("*, paywall:paywalls(course_id)")
            .single();

        if (purchase) {
            const courseId = (purchase.paywall as any)?.course_id;
            if (courseId) {
                // 3. Create Enrollment record to grant access
                await supabase
                    .from('user_course_enrollments')
                    .insert({
                        user_id: purchase.user_id,
                        course_id: courseId,
                        status: 'active'
                    })
                    .select();

                return NextResponse.redirect(
                    new URL(`/courses/${courseId}?payment=success`, request.url)
                );
            }
            // Fallback if course_id lookup fails (deleted course?)
            return NextResponse.redirect(
                new URL("/dashboard/courses?payment=success", request.url)
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
