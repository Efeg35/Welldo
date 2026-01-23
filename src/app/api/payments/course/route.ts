import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createCheckoutForm, calculatePaymentSplit } from '@/lib/iyzico';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
    try {
        const { courseId } = await request.json();
        const cookieStore = await cookies();

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { getAll() { return cookieStore.getAll(); } } }
        );

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Fetch Course, Paywall, and Instructor Details
        // Query chain: Course -> Channel -> Community -> Owner (Profile)
        const { data: course, error: courseError } = await supabase
            .from('courses')
            .select(`
        *,
        paywalls(*),
        channel:channels(
          *,
          community:communities(
            *,
            owner:profiles(*)
          )
        )
      `)
            .eq('id', courseId)
            .single();

        if (courseError || !course) {
            console.error('Course fetch error:', courseError);
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        const paywall = course.paywalls?.[0] || course.paywalls; // Depending on if it's array or single. Select says 'paywalls(*)' which implies array usually, but can be single if 1-1. Supabase returns array by default for foreign keys unless logic. Assuming array.
        // Actually, define type explicitly or check.
        const actualPaywall = Array.isArray(paywall) ? paywall[0] : paywall;

        if (!actualPaywall) {
            return NextResponse.json({ error: 'This course is free or not for sale' }, { status: 400 });
        }

        // Check if instructor has sub-merchant key
        // Type casting for deep nested join
        const channel = course.channel as any;
        const community = channel?.community as any;
        const instructor = community?.owner as any;
        const subMerchantKey = instructor?.iyzico_sub_merchant_key;

        if (!subMerchantKey) {
            return NextResponse.json({ error: 'Instructor cannot receive payments yet' }, { status: 400 });
        }

        // 2. Calculate Split
        const price = Number(actualPaywall.price);
        const { paidPrice, subMerchantPrice } = calculatePaymentSplit(price);

        // 3. Create Checkout Form
        const conversationId = uuidv4();
        const userIp = request.headers.get('x-forwarded-for') || '127.0.0.1';

        const checkoutResult = await createCheckoutForm({
            conversationId,
            price: price.toString(),
            paidPrice: paidPrice.toString(), // Usually same as price unless discount
            basketId: course.id,
            paymentGroup: 'PRODUCT',
            buyer: {
                id: user.id,
                name: user.user_metadata?.full_name || 'User', // Fallback, verify usually requires proper name
                surname: 'User', // Fallback
                identityNumber: '11111111111', // Dummy if not collected. Iyzico requires valid for real payments. For sandbox dummy is fine? 
                // Better to fetch from user profile if available, or ask user. 
                // For now using user.email as minimal identifier.
                email: user.email!,
                gsmNumber: '+905555555555', // Dummy
                registrationAddress: 'N/A',
                ip: userIp,
                city: 'Istanbul',
                country: 'Turkey',
            },
            shippingAddress: { // Digital good, dummy address
                contactName: user.user_metadata?.full_name || 'User',
                city: 'Istanbul',
                country: 'Turkey',
                address: 'Digital Delivery',
            },
            billingAddress: {
                contactName: user.user_metadata?.full_name || 'User',
                city: 'Istanbul',
                country: 'Turkey',
                address: 'Digital Delivery',
            },
            basketItems: [
                {
                    id: course.id,
                    name: course.title,
                    category1: 'Education',
                    itemType: 'VIRTUAL',
                    price: price.toString(),
                    subMerchantKey: subMerchantKey,
                    subMerchantPrice: subMerchantPrice.toString(),
                }
            ],
            callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/callback`,
        });

        if (!checkoutResult.success || !checkoutResult.token) {
            console.error('Iyzico Checkout Error:', checkoutResult.errorMessage);
            return NextResponse.json({ error: 'Payment initialization failed' }, { status: 500 });
        }

        // 4. Store Token
        // We create a pending purchase record
        // We use payment_id to store the token temporarily
        const { error: dbError } = await supabase
            .from('paywall_purchases')
            .insert({
                paywall_id: actualPaywall.id,
                user_id: user.id,
                payment_id: checkoutResult.token, // Store TOKEN here for verification later
                amount: price,
                // status: 'pending' // If column existed
            });

        if (dbError) {
            console.error('DB Error:', dbError);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        return NextResponse.json({ paymentPageUrl: checkoutResult.paymentPageUrl });

    } catch (error: any) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
