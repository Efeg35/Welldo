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
import { User, Building2, Briefcase, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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
            <Card className="border-green-100 bg-green-50/50 shadow-sm">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">Ödeme Hesabı Aktif</CardTitle>
                            <CardDescription className="text-green-800/80">Iyzico entegrasyonu başarıyla tamamlandı.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="p-4 bg-white rounded-lg border border-green-100/50 shadow-sm">
                        <p className="text-sm font-medium text-gray-500 mb-1">Üye İşyeri ID</p>
                        <p className="text-lg font-mono font-bold text-gray-900">{currentKey}</p>
                    </div>
                    <p className="mt-4 text-sm text-gray-500">
                        Ödeme bilgilerinizde değişiklik yapmak için lütfen destek ekibiyle iletişime geçin.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-none shadow-none bg-transparent p-0">
            <CardHeader className="px-0 pt-0 pb-8">
                <CardTitle className="text-3xl font-extrabold text-gray-900 tracking-tight">Ödeme Bilgileri</CardTitle>
                <CardDescription className="text-base text-gray-500">
                    Kurs ve etkinlik satışlarından ödeme alabilmek için banka bilgilerinizi girin.
                </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <FormField
                            control={form.control}
                            name="subMerchantType"
                            render={({ field }) => (
                                <FormItem className="space-y-4">
                                    <FormLabel className="text-base font-bold text-gray-900">Hesap Türü</FormLabel>
                                    <FormControl>
                                        <RadioGroup
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            className="grid grid-cols-1 md:grid-cols-3 gap-4"
                                        >
                                            <FormItem>
                                                <FormControl>
                                                    <RadioGroupItem value="PERSONAL" className="sr-only" />
                                                </FormControl>
                                                <FormLabel className={cn(
                                                    "flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-white p-4 hover:bg-gray-50 hover:text-accent-foreground peer-data-[state=checked]:border-black peer-data-[state=checked]:ring-1 peer-data-[state=checked]:ring-black cursor-pointer transition-all h-full",
                                                    field.value === 'PERSONAL' && "border-black bg-gray-50"
                                                )}>
                                                    <User className="mb-3 h-6 w-6 text-gray-900" />
                                                    <span className="text-sm font-bold text-gray-900">Bireysel</span>
                                                    <span className="text-xs text-gray-500 text-center mt-1">Şahıs ödemeleri için</span>
                                                </FormLabel>
                                            </FormItem>

                                            <FormItem>
                                                <FormControl>
                                                    <RadioGroupItem value="PRIVATE_COMPANY" className="sr-only" />
                                                </FormControl>
                                                <FormLabel className={cn(
                                                    "flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-white p-4 hover:bg-gray-50 hover:text-accent-foreground peer-data-[state=checked]:border-black peer-data-[state=checked]:ring-1 peer-data-[state=checked]:ring-black cursor-pointer transition-all h-full",
                                                    field.value === 'PRIVATE_COMPANY' && "border-black bg-gray-50"
                                                )}>
                                                    <Briefcase className="mb-3 h-6 w-6 text-gray-900" />
                                                    <span className="text-sm font-bold text-gray-900">Şahıs Şirketi</span>
                                                    <span className="text-xs text-gray-500 text-center mt-1">Vergi levhası olanlar</span>
                                                </FormLabel>
                                            </FormItem>

                                            <FormItem>
                                                <FormControl>
                                                    <RadioGroupItem value="LIMITED_OR_JOINT_STOCK_COMPANY" className="sr-only" />
                                                </FormControl>
                                                <FormLabel className={cn(
                                                    "flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-white p-4 hover:bg-gray-50 hover:text-accent-foreground peer-data-[state=checked]:border-black peer-data-[state=checked]:ring-1 peer-data-[state=checked]:ring-black cursor-pointer transition-all h-full",
                                                    field.value === 'LIMITED_OR_JOINT_STOCK_COMPANY' && "border-black bg-gray-50"
                                                )}>
                                                    <Building2 className="mb-3 h-6 w-6 text-gray-900" />
                                                    <span className="text-sm font-bold text-gray-900">Ltd. / A.Ş.</span>
                                                    <span className="text-xs text-gray-500 text-center mt-1">Kurumsal şirketler</span>
                                                </FormLabel>
                                            </FormItem>
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <FormLabel className="text-base font-bold text-gray-900">Ad Soyad / Yetkili Kişi</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ad Soyad" className="h-11 bg-white border-gray-300 focus:border-gray-900 focus:ring-0 rounded-md text-base" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <FormLabel className="text-base font-bold text-gray-900">E-posta</FormLabel>
                                        <FormControl>
                                            <Input placeholder="ornek@email.com" className="h-11 bg-white border-gray-300 focus:border-gray-900 focus:ring-0 rounded-md text-base" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="identityNumber"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <FormLabel className="text-base font-bold text-gray-900">TC Kimlik No (TCKN)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="11111111111" maxLength={11} className="h-11 bg-white border-gray-300 focus:border-gray-900 focus:ring-0 rounded-md text-base" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="gsmNumber"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <FormLabel className="text-base font-bold text-gray-900">Cep Telefonu</FormLabel>
                                        <FormControl>
                                            <Input placeholder="+905..." className="h-11 bg-white border-gray-300 focus:border-gray-900 focus:ring-0 rounded-md text-base" {...field} />
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
                                <FormItem className="space-y-2">
                                    <FormLabel className="text-base font-bold text-gray-900">Adres</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Tam adresiniz..." className="h-11 bg-white border-gray-300 focus:border-gray-900 focus:ring-0 rounded-md text-base" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="iban"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                    <FormLabel className="text-base font-bold text-gray-900">IBAN</FormLabel>
                                    <FormControl>
                                        <Input placeholder="TR..." className="h-11 bg-white border-gray-300 focus:border-gray-900 focus:ring-0 rounded-md text-base" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {subMerchantType !== 'PERSONAL' && (
                            <div className="space-y-6 pt-6 animate-in slide-in-from-top-2 fade-in">
                                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                                    <Building2 className="w-5 h-5 text-gray-900" />
                                    <h3 className="text-lg font-bold text-gray-900">Şirket Bilgileri</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="legalCompanyTitle"
                                        render={({ field }) => (
                                            <FormItem className="space-y-2">
                                                <FormLabel className="text-base font-bold text-gray-900">Yasal Şirket Unvanı</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Örnek Ltd. Şti." className="h-11 bg-white border-gray-300 focus:border-gray-900 focus:ring-0 rounded-md text-base" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="taxNumber"
                                        render={({ field }) => (
                                            <FormItem className="space-y-2">
                                                <FormLabel className="text-base font-bold text-gray-900">Vergi Numarası</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="1234567890" className="h-11 bg-white border-gray-300 focus:border-gray-900 focus:ring-0 rounded-md text-base" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="taxOffice"
                                        render={({ field }) => (
                                            <FormItem className="space-y-2">
                                                <FormLabel className="text-base font-bold text-gray-900">Vergi Dairesi</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Vergi Dairesi Adı" className="h-11 bg-white border-gray-300 focus:border-gray-900 focus:ring-0 rounded-md text-base" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="pt-4">
                            <Button type="submit" disabled={isLoading} className="w-full md:w-auto h-12 text-base bg-gray-900 text-white hover:bg-black rounded-lg px-8 transition-all hover:scale-[1.02] active:scale-[0.98]">
                                {isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Kaydediliyor...</span>
                                    </div>
                                ) : 'Ödeme Bilgilerini Kaydet'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
