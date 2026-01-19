"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Mail, Lock, Loader2, Chrome } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const supabase = createClient();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            router.push("/");
            router.refresh();
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

    return (
        <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4">
            <div className="w-full max-w-sm space-y-6">
                {/* Logo & Title */}
                <div className="text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600">
                        <span className="text-2xl font-bold text-white">W</span>
                    </div>
                    <h1 className="text-2xl font-bold">Hoş Geldin!</h1>
                    <p className="text-sm text-muted-foreground">
                        Hesabına giriş yap
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="rounded-lg bg-destructive/10 p-3 text-center text-sm text-destructive">
                        {error}
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleEmailLogin} className="space-y-4">
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
                            placeholder="Şifre"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-10"
                            required
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            "Giriş Yap"
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

                {/* Register Link */}
                <p className="text-center text-sm text-muted-foreground">
                    Hesabın yok mu?{" "}
                    <Link
                        href="/register"
                        className="font-medium text-violet-500 hover:underline"
                    >
                        Kayıt ol
                    </Link>
                </p>
            </div>
        </div>
    );
}
