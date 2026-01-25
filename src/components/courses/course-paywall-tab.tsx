'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { getPaywall, upsertPaywall, deletePaywall } from '@/actions/paywalls';
import { createBrowserClient } from '@supabase/ssr';
import { Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// --------------------------------------------------------
// PaywallTab: Generic component for Course and Channel paywalls
// --------------------------------------------------------

interface PaywallTabProps {
    entityId: string;
    type: 'course' | 'channel';
}

export function PaywallTab({ entityId, type }: PaywallTabProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isPaid, setIsPaid] = useState(false);
    const [price, setPrice] = useState<string>('');
    const [currency, setCurrency] = useState('TRY');
    const [hasMerchantKey, setHasMerchantKey] = useState<boolean | null>(null);

    const label = type === 'course' ? 'Kurs' : 'Alan';

    useEffect(() => {
        async function loadData() {
            try {
                const supabase = createBrowserClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
                );

                // Check instructor status
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('iyzico_sub_merchant_key')
                        .eq('id', user.id)
                        .single();
                    setHasMerchantKey(!!profile?.iyzico_sub_merchant_key);
                }

                // Load paywall
                const { paywall } = await getPaywall(entityId, type);
                if (paywall) {
                    setIsPaid(true);
                    setPrice(paywall.price.toString());
                    setCurrency(paywall.currency);
                }
            } catch (error) {
                console.error('Failed to load paywall data', error);
            } finally {
                setIsLoading(false);
            }
        }

        loadData();
    }, [entityId, type]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            if (!isPaid) {
                // If switching to free, delete paywall
                const result = await deletePaywall(entityId, type);
                if (result.success) {
                    toast.success(`${label} şimdi ücretsiz.`);
                } else {
                    toast.error(`${label} durumu güncellenemedi.`);
                }
            } else {
                // Upsert paywall
                const numericPrice = parseFloat(price);
                if (isNaN(numericPrice) || numericPrice <= 0) {
                    toast.error('Lütfen geçerli bir fiyat girin.');
                    setIsSaving(false);
                    return;
                }

                const result = await upsertPaywall(entityId, type, numericPrice, currency);
                if (result.success) {
                    toast.success('Ödeme duvarı başarıyla kaydedildi.');
                } else {
                    toast.error(result.error || 'Kaydedilemedi.');
                }
            }
        } catch (error) {
            toast.error('An unexpected error occurred.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h3 className="text-lg font-medium">Ödeme Ayarları</h3>
                <p className="text-sm text-gray-500">{label} için bir fiyat belirleyin veya ücretsiz yapın.</p>
            </div>

            <div className="flex items-center space-x-2">
                <Switch
                    id="paid-mode"
                    checked={isPaid}
                    onCheckedChange={setIsPaid}
                />
                <Label htmlFor="paid-mode">Bu {label.toLowerCase()} ücretlidir</Label>
            </div>

            {isPaid && (
                <div className="space-y-4 border p-4 rounded-md bg-gray-50/50">
                    {!hasMerchantKey && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Ödeme Ayarları Eksik</AlertTitle>
                            <AlertDescription>
                                Ödeme alabilmek için hesap ayarlarınızı tamamlamanız gerekmektedir.
                                <Link href="/dashboard/settings/payouts" className="font-medium underline ml-1">
                                    Ayarlara Git
                                </Link>
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="price">Fiyat (TRY)</Label>
                        <Input
                            id="price"
                            type="number"
                            min="0"
                            step="0.01"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="örn. 99.90"
                        />
                    </div>
                </div>
            )}

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving || (isPaid && !hasMerchantKey)} className="bg-gray-900 text-white hover:bg-gray-800 rounded-full">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Değişiklikleri Kaydet
                </Button>
            </div>
        </div>
    );
}

// Wrapper for backward compatibility
export function CoursePaywallTab({ courseId }: { courseId: string }) {
    return <PaywallTab entityId={courseId} type="course" />;
}

// Wrapper for Channel Paywalls
export function ChannelPaywallTab({ channelId }: { channelId: string }) {
    return <PaywallTab entityId={channelId} type="channel" />;
}
