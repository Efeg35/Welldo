import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Users,
  Video,
  Calendar,
  Trophy,
  MessageCircle,
  Star,
  ArrowRight,
  Check
} from "lucide-react";
import Link from "next/link";

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If user is logged in, redirect to dashboard
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #408FED 0%, #3E1BC9 100%)' }}
            >
              <span className="text-white font-bold text-sm">W</span>
            </div>
            <span className="text-xl font-bold">WellDo</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground">Özellikler</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground">Fiyatlandırma</a>
            <a href="#community" className="text-sm text-muted-foreground hover:text-foreground">Topluluk</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Giriş Yap</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" style={{ background: 'linear-gradient(135deg, #408FED 0%, #3E1BC9 100%)' }}>
                Ücretsiz Başla
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-6 bg-[#408FED]/10 text-[#408FED] hover:bg-[#408FED]/20 border-none">
            🚀 Türkiye'nin #1 Fitness Platformu
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Fitness ve Wellness
            <span className="block" style={{ background: 'linear-gradient(135deg, #408FED 0%, #3E1BC9 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Toplulukları
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Canlı dersler, online etkinlikler ve etkileşimli topluluklar ile fitness yolculuğunu bir üst seviyeye taşı.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="gap-2" style={{ background: 'linear-gradient(135deg, #408FED 0%, #3E1BC9 100%)' }}>
                <Play className="w-5 h-5" fill="currentColor" />
                Hemen Başla
              </Button>
            </Link>
            <Link href="/events">
              <Button size="lg" variant="outline" className="gap-2">
                Etkinlikleri Keşfet
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">5,000+</p>
              <p className="text-sm text-muted-foreground">Aktif Üye</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">200+</p>
              <p className="text-sm text-muted-foreground">Canlı Ders</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">50+</p>
              <p className="text-sm text-muted-foreground">Eğitmen</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Tüm Özellikler Tek Platformda</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Circle.so teknolojisi ile güçlendirilmiş, fitness ve wellness için tasarlanmış platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Users, title: "Topluluklar", desc: "Kendi fitness topluluğunu kur veya mevcut topluluklara katıl." },
              { icon: MessageCircle, title: "Canlı Sohbet", desc: "Eğitmenler ve üyelerle gerçek zamanlı iletişim kur." },
              { icon: Video, title: "Canlı Dersler", desc: "Zoom entegrasyonu ile canlı fitness dersleri düzenle." },
              { icon: Calendar, title: "Etkinlikler", desc: "Online ve fiziksel etkinlikler oluştur, bilet sat." },
              { icon: Trophy, title: "Gamification", desc: "Puan ve rozet sistemi ile motivasyonu artır." },
              { icon: Star, title: "Kurslar", desc: "Video tabanlı eğitim içerikleri oluştur ve paylaş." },
            ].map((feature, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                  style={{ background: 'linear-gradient(135deg, #408FED 0%, #3E1BC9 100%)' }}
                >
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Basit ve Şeffaf Fiyatlandırma</h2>
            <p className="text-muted-foreground">Ücretsiz başla, istediğin zaman yükselt.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Free Plan */}
            <div className="bg-card border border-border rounded-xl p-8">
              <h3 className="text-xl font-semibold mb-2">Ücretsiz</h3>
              <p className="text-muted-foreground mb-6">Başlamak için ideal</p>
              <p className="text-4xl font-bold mb-6">₺0 <span className="text-sm font-normal text-muted-foreground">/ ay</span></p>
              <ul className="space-y-3 mb-8">
                {["3 topluluğa katılma", "Canlı derslere katılım", "Temel gamification", "Mobil uygulama"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/register">
                <Button variant="outline" className="w-full">Ücretsiz Başla</Button>
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-card border-2 border-[#408FED] rounded-xl p-8 relative">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#408FED]">Popüler</Badge>
              <h3 className="text-xl font-semibold mb-2">Pro</h3>
              <p className="text-muted-foreground mb-6">Eğitmenler için</p>
              <p className="text-4xl font-bold mb-6">₺299 <span className="text-sm font-normal text-muted-foreground">/ ay</span></p>
              <ul className="space-y-3 mb-8">
                {["Sınırsız topluluk", "Kendi topluluğunu kur", "Bilet satışı", "Zoom entegrasyonu", "Email marketing", "Öncelikli destek"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/register">
                <Button className="w-full" style={{ background: 'linear-gradient(135deg, #408FED 0%, #3E1BC9 100%)' }}>
                  14 Gün Ücretsiz Dene
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div
          className="max-w-4xl mx-auto rounded-2xl p-12 text-center text-white"
          style={{ background: 'linear-gradient(135deg, #408FED 0%, #3E1BC9 100%)' }}
        >
          <h2 className="text-3xl font-bold mb-4">Fitness Yolculuğuna Başla</h2>
          <p className="text-white/80 mb-8 max-w-lg mx-auto">
            Binlerce kişi WellDo ile formda kalıyor. Hemen katıl ve farkı hisset.
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-white text-[#3E1BC9] hover:bg-white/90 gap-2">
              <Play className="w-5 h-5" fill="currentColor" />
              Hemen Başla
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #408FED 0%, #3E1BC9 100%)' }}
            >
              <span className="text-white font-bold text-sm">W</span>
            </div>
            <span className="font-bold">WellDo</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 WellDo. Tüm hakları saklıdır.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Gizlilik</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Kullanım Koşulları</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">İletişim</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
