'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createSubMerchant, SubMerchantData } from '@/lib/iyzico/submerchant';
import { z } from 'zod';

const schema = z.object({
    subMerchantType: z.enum(['PERSONAL', 'PRIVATE_COMPANY', 'LIMITED_OR_JOINT_STOCK_COMPANY']),
    name: z.string().min(2),
    email: z.string().email(),
    gsmNumber: z.string().min(10),
    address: z.string().min(10),
    iban: z.string().min(26).startsWith('TR'),
    identityNumber: z.string().length(11), // For personal
    taxNumber: z.string().optional(), // For company
    taxOffice: z.string().optional(), // For company
    legalCompanyTitle: z.string().optional(), // For company
});

export async function onboardInstructor(formData: z.infer<typeof schema>) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    // Server actions can't set cookies in this context usually, but for auth verification we just read
                },
            },
        }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: 'Unauthorized' };
    }

    // Helper to map form data to Iyzico expectation
    const subMerchantData: SubMerchantData = {
        ...formData,
        // If personal, taxNumber is unlikely needed but library might require it or handle it. checks logic below
        taxNumber: formData.taxNumber || '',
        legalCompanyTitle: formData.legalCompanyTitle || '',
    };

    try {
        const result = await createSubMerchant(subMerchantData);

        if (result.success && result.subMerchantKey) {
            // Save key to profile
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ iyzico_sub_merchant_key: result.subMerchantKey })
                .eq('id', user.id);

            if (updateError) {
                console.error('Error saving sub-merchant key:', updateError);
                return { error: 'Failed to save payout settings locally.' };
            }

            return { success: true };
        } else {
            return { error: result.error || 'Failed to create sub-merchant on Iyzico.' };
        }
    } catch (err: any) {
        console.error('Onboarding error:', err);
        return { error: err.message || 'An unexpected error occurred.' };
    }
}
