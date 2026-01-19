"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Mail, Lock, User, Loader2, Chrome } from "lucide-react";

export default function RegisterPage() {
    const router = useRouter();
    const supabase = createClient();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    role: "member", // Default role
                },
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            setSuccess(true);
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4">
                <div className="w-full max-w-sm space-y-6 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
                        <Mail className="h-8 w-8 text-emerald-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">E-postanı kontrol et!</h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Hesabını doğrulamak için <strong>{email}</strong> adresine bir
                            link gönderdik.
                        </p>
                    </div>
                    <Link href="/login">
                        <Button variant="outline" className="w-full">
                            Giriş sayfasına dön
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4">
            <div className="w-full max-w-sm space-y-6">
                {/* Logo & Title */}
                <div className="text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600">
                        <span className="text-2xl font-bold text-white">W</span>
                    </div>
                    <h1 className="text-2xl font-bold">Hesap Oluştur</h1>
                    <p className="text-sm text-muted-foreground">
                        WellDo ailesine katıl
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="rounded-lg bg-destructive/10 p-3 text-center text-sm text-destructive">
                        {error}
                    </div>
                )}

                {/* Register Form */}
                <form onSubmit={handleRegister} className="space-y-4">
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Ad Soyad"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="pl-10"
                            required
                        />
                    </div>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="email"
                            placeholder="E-posta"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10"
                            required
                        />
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="password"
                            placeholder="Şifre (en az 6 karakter)"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-10"
                            minLength={6}
                            required
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            "Kayıt Ol"
                        )}
                    </Button>
                </form>

                <div className="flex items-center gap-4">
                    <Separator className="flex-1" />
                    <span className="text-xs text-muted-foreground">veya</span>
                    <Separator className="flex-1" />
                </div>

                {/* Social Login */}
                <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                >
                    <Chrome className="h-4 w-4" />
                    Google ile devam et
                </Button>

                {/* Login Link */}
                <p className="text-center text-sm text-muted-foreground">
                    Zaten hesabın var mı?{" "}
                    <Link
                        href="/login"
                        className="font-medium text-violet-500 hover:underline"
                    >
                        Giriş yap
                    </Link>
                </p>
            </div>
        </div>
    );
}
