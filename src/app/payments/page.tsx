import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    CreditCard,
    Wallet,
    Lock,
    Check,
    X
} from "lucide-react";
import Link from "next/link";

export default function PaymentsPage() {
    return (
        <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl bg-card rounded-2xl shadow-xl overflow-hidden flex">
                {/* Left Panel - Product Details */}
                <div className="flex-1 p-8 border-r border-border">
                    {/* Brand */}
                    <div className="flex items-center gap-3 mb-8">
                        <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #408FED 0%, #3E1BC9 100%)' }}
                        >
                            <span className="text-white font-bold">E</span>
                        </div>
                        <span className="text-lg font-semibold">ElevateAcademy</span>
                    </div>

                    {/* Product */}
                    <div className="bg-muted/50 rounded-xl p-6 mb-6">
                        <h2 className="text-xl font-semibold mb-2">VIP Koçluk</h2>
                        <p className="text-muted-foreground text-sm mb-6">
                            Dönüşüm, yapı ve büyüme için özelleştirilmiş koçluk.
                        </p>

                        {/* Pricing Options */}
                        <RadioGroup defaultValue="annual" className="space-y-3">
                            <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-card">
                                <div className="flex items-center gap-3">
                                    <RadioGroupItem value="annual" id="annual" />
                                    <div>
                                        <Label htmlFor="annual" className="font-medium">₺100 /yıl</Label>
                                        <Badge className="ml-2 bg-green-100 text-green-700 hover:bg-green-100">En iyi değer</Badge>
                                    </div>
                                </div>
                                <span className="text-sm text-muted-foreground">Yıllık abonelik</span>
                            </div>

                            <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-card">
                                <div className="flex items-center gap-3">
                                    <RadioGroupItem value="monthly" id="monthly" />
                                    <Label htmlFor="monthly" className="font-medium">₺10 /ay</Label>
                                </div>
                                <span className="text-sm text-muted-foreground">Aylık abonelik</span>
                            </div>
                        </RadioGroup>

                        {/* Promo Code */}
                        <div className="flex items-center gap-2 mt-4 p-3 bg-[#408FED]/10 rounded-lg">
                            <Badge variant="outline" className="bg-[#408FED]/20 border-[#408FED] text-[#408FED]">
                                🎟️ SAVENOW
                            </Badge>
                            <span className="text-sm">%20 ömür boyu indirim</span>
                            <Button variant="ghost" size="icon" className="ml-auto h-6 w-6">
                                <X className="w-3 h-3" />
                            </Button>
                        </div>
                    </div>

                    {/* Total */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="font-medium">Bugün ödenecek toplam</span>
                            <div className="text-right">
                                <span className="text-muted-foreground line-through mr-2">₺100</span>
                                <span className="text-xl font-bold">₺80 TRY</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <Link href="#" className="text-[#408FED] hover:underline">Sipariş detaylarını görüntüle</Link>
                            <span className="text-green-600">Toplam kazanç: ₺40 TRY</span>
                        </div>
                        <p className="text-xs text-muted-foreground pt-2">
                            Vergiler dahildir. Sonraki yıllık ödeme: 13 Mayıs 2026
                        </p>
                    </div>
                </div>

                {/* Right Panel - Payment Form */}
                <div className="w-96 p-8 bg-card">
                    {/* Account Info */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-4">Hesabınız</h3>
                        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                            <div className="flex items-center gap-3">
                                <Avatar className="w-10 h-10">
                                    <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=ravi" />
                                    <AvatarFallback>RP</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">Ravi Patel</p>
                                    <p className="text-sm text-muted-foreground">ravipatel@thecoursecreator.com</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" className="text-muted-foreground">
                                Çıkış
                            </Button>
                        </div>
                    </div>

                    {/* Payment Details */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Ödeme detayları</h3>

                        <RadioGroup defaultValue="saved" className="space-y-3 mb-6">
                            {/* Saved Card */}
                            <div className="flex items-center justify-between p-4 border border-[#408FED] rounded-xl bg-[#408FED]/5">
                                <div className="flex items-center gap-3">
                                    <RadioGroupItem value="saved" id="saved" />
                                    <CreditCard className="w-5 h-5 text-muted-foreground" />
                                    <Label htmlFor="saved">Kayıtlı</Label>
                                </div>
                            </div>

                            {/* Saved Card Details */}
                            <div className="flex items-center justify-between p-4 border border-border rounded-xl ml-6">
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded font-bold">VISA</div>
                                    <span className="text-muted-foreground">Visa Kart</span>
                                    <span className="text-muted-foreground">•••• 6998</span>
                                </div>
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                    <span className="text-muted-foreground">...</span>
                                </Button>
                            </div>

                            {/* New Card */}
                            <div className="flex items-center justify-between p-4 border border-border rounded-xl">
                                <div className="flex items-center gap-3">
                                    <RadioGroupItem value="card" id="card" />
                                    <CreditCard className="w-5 h-5 text-muted-foreground" />
                                    <Label htmlFor="card">Kart</Label>
                                </div>
                            </div>

                            {/* Google Pay */}
                            <div className="flex items-center justify-between p-4 border border-border rounded-xl">
                                <div className="flex items-center gap-3">
                                    <RadioGroupItem value="gpay" id="gpay" />
                                    <div className="flex items-center gap-1">
                                        <span className="text-blue-500 font-bold text-sm">G</span>
                                        <span className="text-red-500 font-bold text-sm">o</span>
                                        <span className="text-yellow-500 font-bold text-sm">o</span>
                                        <span className="text-blue-500 font-bold text-sm">g</span>
                                        <span className="text-green-500 font-bold text-sm">l</span>
                                        <span className="text-red-500 font-bold text-sm">e</span>
                                    </div>
                                    <Label htmlFor="gpay">Google Pay</Label>
                                </div>
                            </div>
                        </RadioGroup>

                        {/* Full Name */}
                        <div className="space-y-2 mb-6">
                            <Label htmlFor="fullname">Ad Soyad</Label>
                            <Input id="fullname" placeholder="Adınızı ve soyadınızı girin" />
                        </div>

                        {/* Tax ID */}
                        <Link href="#" className="text-[#408FED] text-sm hover:underline">
                            Vergi numarası ekle
                        </Link>

                        {/* Pay Button */}
                        <Button
                            className="w-full mt-6 h-12 text-base gap-2"
                            style={{ background: 'linear-gradient(135deg, #408FED 0%, #3E1BC9 100%)' }}
                        >
                            <Lock className="w-4 h-4" />
                            ₺80 TL Öde
                        </Button>

                        {/* Security Badge */}
                        <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
                            <Lock className="w-3 h-3" />
                            Circle ile güvenli
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
