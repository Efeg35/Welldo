'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { onboardInstructor } from '@/actions/payments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const formSchema = z.object({
    subMerchantType: z.enum(['PERSONAL', 'PRIVATE_COMPANY', 'LIMITED_OR_JOINT_STOCK_COMPANY']),
    name: z.string().min(2, 'Ad Soyad çok kısa'),
    email: z.string().email('Geçersiz e-posta adresi'),
    gsmNumber: z.string().min(10, 'GSM numarası zorunludur'),
    address: z.string().min(10, 'Adres çok kısa'),
    iban: z.string().min(26, 'Geçersiz IBAN').startsWith('TR', 'IBAN TR ile başlamalıdır'),
    identityNumber: z.string().length(11, 'TCKN 11 haneli olmalıdır'),
    taxNumber: z.string().optional(),
    taxOffice: z.string().optional(),
    legalCompanyTitle: z.string().optional(),
}).refine((data) => {
    if (data.subMerchantType !== 'PERSONAL') {
        return !!data.taxNumber && !!data.taxOffice && !!data.legalCompanyTitle;
    }
    return true;
}, {
    message: "Şirket hesapları için şirket bilgileri zorunludur",
    path: ["taxNumber"],
});

export function PayoutSettings({ currentKey }: { currentKey?: string | null }) {
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            subMerchantType: 'PERSONAL',
            name: '',
            email: '',
            gsmNumber: '',
            address: '',
            iban: 'TR',
            identityNumber: '',
            taxNumber: '',
            taxOffice: '',
            legalCompanyTitle: '',
        },
    });

    const subMerchantType = form.watch('subMerchantType');

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        try {
            const result = await onboardInstructor(values);
            if (result.success) {
                toast.success('Ödeme bilgileri başarıyla kaydedildi!');
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error('Bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setIsLoading(false);
        }
    }

    if (currentKey) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Ödeme Ayarları</CardTitle>
                    <CardDescription>Hesabınız ödeme almak için Iyzico'ya bağlı.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-2 text-green-600">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                        <span>Üye İşyeri ID: {currentKey}</span>
                    </div>
                    <p className="mt-4 text-sm text-gray-500">Ödeme bilgilerinizi güncellemek için lütfen destek ekibiyle iletişime geçin.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Ödeme Bilgileri</CardTitle>
                <CardDescription>Kurs satışlarından ödeme alabilmek için banka bilgilerinizi girin.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="subMerchantType"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                    <FormLabel>Hesap Türü</FormLabel>
                                    <FormControl>
                                        <RadioGroup
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            className="flex flex-col space-y-1"
                                        >
                                            <FormItem className="flex items-center space-x-3 space-y-0">
                                                <FormControl>
                                                    <RadioGroupItem value="PERSONAL" />
                                                </FormControl>
                                                <FormLabel className="font-normal">
                                                    Bireysel (Şahıs)
                                                </FormLabel>
                                            </FormItem>
                                            <FormItem className="flex items-center space-x-3 space-y-0">
                                                <FormControl>
                                                    <RadioGroupItem value="PRIVATE_COMPANY" />
                                                </FormControl>
                                                <FormLabel className="font-normal">
                                                    Şahıs Şirketi
                                                </FormLabel>
                                            </FormItem>
                                            <FormItem className="flex items-center space-x-3 space-y-0">
                                                <FormControl>
                                                    <RadioGroupItem value="LIMITED_OR_JOINT_STOCK_COMPANY" />
                                                </FormControl>
                                                <FormLabel className="font-normal">
                                                    Limited / Anonim Şirket (Ltd. / A.Ş.)
                                                </FormLabel>
                                            </FormItem>
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ad Soyad / Yetkili Kişi</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ad Soyad" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>E-posta</FormLabel>
                                        <FormControl>
                                            <Input placeholder="ornek@email.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="identityNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>TC Kimlik No (TCKN)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="11111111111" maxLength={11} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="gsmNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cep Telefonu</FormLabel>
                                        <FormControl>
                                            <Input placeholder="+905..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Adres</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Tam adresiniz..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="iban"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>IBAN</FormLabel>
                                    <FormControl>
                                        <Input placeholder="TR..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {subMerchantType !== 'PERSONAL' && (
                            <div className="space-y-4 border-t pt-4">
                                <h3 className="font-medium">Şirket Bilgileri</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="legalCompanyTitle"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Yasal Şirket Unvanı</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Örnek Ltd. Şti." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="taxNumber"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Vergi Numarası</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="1234567890" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="taxOffice"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Vergi Dairesi</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Vergi Dairesi Adı" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        )}

                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Kaydediliyor...' : 'Ödeme Bilgilerini Kaydet'}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
