import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { PayoutSettings } from '@/components/settings/payout-settings';

export default async function PayoutsPage() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
            },
        }
    );

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        redirect('/login');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('iyzico_sub_merchant_key')
        .eq('id', user.id)
        .single();

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <PayoutSettings currentKey={profile?.iyzico_sub_merchant_key} />
        </div>
    );
}
