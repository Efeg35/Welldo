import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createCheckoutForm, calculatePaymentSplit } from "@/lib/iyzico";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const headersList = await headers();

        // Check auth
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { eventId } = await request.json();

        if (!eventId) {
            return NextResponse.json(
                { error: "Event ID is required" },
                { status: 400 }
            );
        }

        // Get event with community info
        const { data: event } = await supabase
            .from("events")
            .select(`*, community:communities(*, owner:profiles(*))`)
            .eq("id", eventId)
            .single();

        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        // Check if already has ticket
        const { data: existingTicket } = await supabase
            .from("tickets")
            .select("id")
            .eq("event_id", eventId)
            .eq("user_id", user.id)
            .single();

        if (existingTicket) {
            // Self-heal: If user has a ticket but no response (due to previous bug), fix it now.
            const { error: healError } = await supabase
                .from("event_responses")
                .upsert({
                    event_id: eventId,
                    user_id: user.id,
                    status: 'attending'
                });

            if (healError) {
                console.error("Failed to heal event response:", healError);
            }

            revalidatePath(`/events/${eventId}`);
            // Return success instead of error so consumer refreshes and sees "Going"
            return NextResponse.json({ success: true, ticket: existingTicket, restored: true });
        }

        // Free event - create ticket directly
        if (event.ticket_price === 0) {
            // ... (existing code)
            const { data: ticket, error: ticketError } = await supabase
                .from("tickets")
                .insert({
                    event_id: eventId,
                    user_id: user.id,
                })
                .select()
                .single();

            if (ticketError) {
                return NextResponse.json({ error: ticketError.message }, { status: 500 });
            }

            // ... (existing code for response)
            const { error: responseError } = await supabase
                .from("event_responses")
                .upsert({
                    event_id: eventId,
                    user_id: user.id,
                    status: 'attending'
                });

            if (responseError) {
                console.error("Failed to create event response for free ticket:", responseError);
            }

            revalidatePath(`/events/${eventId}`);
            return NextResponse.json({ success: true, ticket, free: true });
        }

        // Paid event - create Iyzico checkout
        const subMerchantKey = event.community?.owner?.iyzico_sub_merchant_key;

        if (!subMerchantKey) {
            return NextResponse.json(
                { error: "Instructor payment setup incomplete" },
                { status: 400 }
            );
        }

        const price = event.ticket_price;
        const { subMerchantPrice } = calculatePaymentSplit(price);

        // Get user profile
        const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

        const clientIp = headersList.get("x-forwarded-for") || "127.0.0.1";
        const origin = headersList.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

        const result = await createCheckoutForm({
            price: price.toFixed(2),
            paidPrice: price.toFixed(2),
            currency: "TRY",
            basketId: `ticket_${eventId}_${user.id}`,
            paymentGroup: "PRODUCT",
            callbackUrl: `${origin}/api/payments/callback`,
            buyer: {
                id: user.id,
                name: profile?.full_name?.split(" ")[0] || "Kullanıcı",
                surname: profile?.full_name?.split(" ").slice(1).join(" ") || ".",
                email: user.email || "",
                identityNumber: "11111111111", // Placeholder - would need real TC Kimlik
                registrationAddress: "Türkiye",
                city: "İstanbul",
                country: "Turkey",
                ip: clientIp,
            },
            shippingAddress: {
                contactName: profile?.full_name || "Kullanıcı",
                city: "İstanbul",
                country: "Turkey",
                address: "Türkiye",
            },
            billingAddress: {
                contactName: profile?.full_name || "Kullanıcı",
                city: "İstanbul",
                country: "Turkey",
                address: "Türkiye",
            },
            basketItems: [
                {
                    id: event.id,
                    name: event.title,
                    category: "Etkinlik",
                    price: price.toFixed(2),
                    subMerchantKey,
                    subMerchantPrice: subMerchantPrice.toFixed(2),
                },
            ],
        });

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        // Store pending ticket with token
        await supabase.from("tickets").insert({
            event_id: eventId,
            user_id: user.id,
            iyzico_payment_id: result.token, // Store token temporarily
        });

        return NextResponse.json({
            success: true,
            checkoutFormContent: result.checkoutFormContent,
            token: result.token,
        });
    } catch (error) {
        console.error("Payment error:", error);
        return NextResponse.json(
            { error: "Payment initialization failed" },
            { status: 500 }
        );
    }
}
